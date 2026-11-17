/**
 * @file Builds the Elastic Beats script processors from the `parse_*.ts` files stored next to it.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

// eslint-disable-next-line tslop/no-known-value-widening -- the level is looked up by a string captured from the log line, so the dictionary must stay open
const dummyData: Record<string, string | undefined> = {
  message: 'foo',
};

/**
 * Stand-in for the Beats event object, used to run each processor once at build time.
 */
/* eslint-disable sonarjs/function-name -- the Beats event API fixes these method names */
const dummyEvent = {
  // The Beats event API fixes these method names.
  Get(key: string): string | undefined {
    return dummyData[key] || undefined;
  },

  Put(key: string, value: string): string {
    // eslint-disable-next-line functional/immutable-data -- this stand-in stores event fields in place, as the Beats event object does
    dummyData[key] = value;
    return value;
  },

  Rename(sourceKey: string, targetKey: string): boolean {
    if (dummyData[sourceKey] !== undefined) {
      // eslint-disable-next-line functional/immutable-data -- this stand-in stores event fields in place, as the Beats event object does
      dummyData[targetKey] = dummyData[sourceKey];
      // eslint-disable-next-line functional/immutable-data -- this stand-in stores event fields in place, as the Beats event object does
      delete dummyData[sourceKey];
      return true;
    }
    return false;
  },

  Delete(key: string): boolean {
    if (dummyData[key] !== undefined) {
      // eslint-disable-next-line functional/immutable-data -- this stand-in stores event fields in place, as the Beats event object does
      delete dummyData[key];
      return true;
    }
    return false;
  },

  Cancel(): void {
    //
  },

  Tag(): void {
    //
  },

  AppendTo(key: string, value: string): void {
    if (dummyData[key]) {
      // eslint-disable-next-line functional/immutable-data -- this stand-in stores event fields in place, as the Beats event object does
      dummyData[key] += value; // Append value to existing data
    } else {
      // eslint-disable-next-line functional/immutable-data -- this stand-in stores event fields in place, as the Beats event object does
      dummyData[key] = value; // If key doesn't exist, create it
    }
  },
};
/* eslint-enable sonarjs/function-name -- end of the Beats event API stand-in */

// This package is CommonJS, so __dirname is defined at runtime.
// eslint-disable-next-line unicorn/prefer-module -- this package is CommonJS, where __dirname is defined
const processorDirectory = __dirname;

/** Matches the TypeScript file name of a script processor. */
const PARSER_FILE_PATTERN = /^parse_.*\.ts$/u;

/** The sandbox a processor script runs in, and the globals it leaves on it. */
type ProcessorSandbox = {
  module: { exports: object };
  exports: object;
  require: NodeRequire;
  dummyEvent: typeof dummyEvent;
  processLog?: (event: typeof dummyEvent) => void;
  logPattern?: RegExp;
};
// eslint-disable-next-line n/no-sync -- scriptProcessors is a synchronous module-level export read at require time by the Pulumi program, so it cannot await
const processorFiles = readdirSync(processorDirectory);

export const scriptProcessors = processorFiles
  .filter((file) => PARSER_FILE_PATTERN.test(file))
  .map((file) => ({
    processorId: path.basename(file, '.ts'),
    // eslint-disable-next-line n/no-sync -- scriptProcessors is a synchronous module-level export read at require time by the Pulumi program, so it cannot await
    fileContent: readFileSync(path.join(processorDirectory, file), 'utf8'),
  }))
  .map(({ processorId, fileContent }) => {
    const { outputText: transpiledCode } = transpileModule(fileContent, {
      compilerOptions: {
        // The Beats JavaScript processor engine only runs ES5 output.
        // eslint-disable-next-line sonarjs/deprecation, @typescript-eslint/no-deprecated -- the Beats engine only runs ES5 output
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
    }
    throw new Error(`Transpilation failed for file: ${processorId}`);
  })
  .map(({ processorId, transpiledCode }) => {
    const context: ProcessorSandbox = {
      module: { exports: {} },
      exports: {},
      // eslint-disable-next-line unicorn/prefer-module -- processors may load CommonJS modules through this require
      require,
      dummyEvent,
    };
    // createContext contextifies the object in place, so the script's globals are read back from it.
    createContext(context);

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
      }
      throw new Error(`Invalid data encountered in file: ${processorId}`);
    } else {
      throw new TypeError(
        `'process' function not found in file: ${processorId}`,
      );
    }
  });
