/**
 * @file Builds the Elastic Beats script processors from the `parse_*.ts` files stored next to it.
 */
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createContext, runInContext } from 'node:vm';

const dummyData = {
  message: 'foo',
} as Record<string, string>;

/**
 * Stand-in for the Beats event object, used to run each processor once at build time.
 */
const dummyEvent = {
  // The Beats event API fixes these method names.
  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  Get<T>(key: string): T | undefined {
    if (dummyData[key]) {
      return dummyData[key] as T;
    }
    return undefined;
  },

  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  Put(key: string, value: string): string {
    dummyData[key] = value;
    return value;
  },

  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  Rename(sourceKey: string, targetKey: string): boolean {
    if (dummyData[sourceKey] !== undefined) {
      dummyData[targetKey] = dummyData[sourceKey];
      delete dummyData[sourceKey];
      return true;
    }
    return false;
  },

  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  Delete(key: string): boolean {
    if (dummyData[key] !== undefined) {
      delete dummyData[key];
      return true;
    }
    return false;
  },

  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  Cancel(): void {
    //
  },

  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  Tag(): void {
    //
  },

  // eslint-disable-next-line sonarjs/function-name -- Beats event API method names are fixed
  AppendTo(key: string, value: string): void {
    if (dummyData[key]) {
      dummyData[key] += value; // Append value to existing data
    } else {
      dummyData[key] = value; // If key doesn't exist, create it
    }
  },
};

// This package is CommonJS, so __dirname is defined at runtime.
// eslint-disable-next-line unicorn/prefer-module -- this package is CommonJS, where __dirname is defined
const processorDirectory = __dirname;

// eslint-disable-next-line n/no-sync -- scriptProcessors is a synchronous module-level export read at require time by the Pulumi program, so it cannot await
const processorFiles = readdirSync(processorDirectory);

export const scriptProcessors = processorFiles
  .filter((file) => /^parse_.*\.ts$/.test(file))
  .map((file) => {
    return {
      processorId: path.basename(file, '.ts'),
      // eslint-disable-next-line n/no-sync -- scriptProcessors is a synchronous module-level export read at require time by the Pulumi program, so it cannot await
      fileContent: readFileSync(path.join(processorDirectory, file), 'utf8'),
    };
  })
  .map(({ processorId, fileContent }) => {
    const { outputText: transpiledCode } = transpileModule(fileContent, {
      compilerOptions: {
        // The Beats JavaScript processor engine only runs ES5 output.
        // eslint-disable-next-line sonarjs/deprecation -- the Beats engine only runs ES5 output
        target: ScriptTarget.ES5,
        module: ModuleKind.CommonJS,
        removeComments: true,
      },
    });

    if (transpiledCode) {
      return {
        processorId,
        transpiledCode,
      };
    } else {
      throw new Error(`Transpilation failed for file: ${processorId}`);
    }
  })
  .map(({ processorId, transpiledCode }) => {
    const context = createContext({
      module: { exports: {} },
      exports: {},
      // eslint-disable-next-line unicorn/prefer-module -- processors may load CommonJS modules through this require
      require,
      dummyEvent,
    });

    // eslint-disable-next-line sonarjs/code-eval -- the code is a repository file transpiled at build time
    runInContext(transpiledCode, context);

    if (typeof context.processLog === 'function') {
      context.processLog(context.dummyEvent);
      if (context.logPattern) {
        return {
          script: {
            when: {
              regexp: {
                message: context.logPattern
                  .toString()
                  .slice(
                    1,
                    context.logPattern.toString().endsWith('/g') ? -2 : -1,
                  )
                  .replaceAll(String.raw`\u00`, String.raw`\\u0000`),
              },
            },
            lang: 'javascript',
            id: processorId,
            source: transpiledCode.replace('processLog', 'process'),
          },
        };
      } else {
        throw new Error(`Invalid data encountered in file: ${processorId}`);
      }
    } else {
      throw new TypeError(
        `'process' function not found in file: ${processorId}`,
      );
    }
  });
