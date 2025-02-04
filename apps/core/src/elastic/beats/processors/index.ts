import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

// noinspection JSUnusedGlobalSymbols
const dummyEvent = {
  data: {
    message: 'foo',
  } as Record<string, string>,

  Get<T>(key: string): T | undefined {
    if (this.data[key]) {
      return this.data[key] as T;
    }
    return undefined;
  },

  Put(key: string, value: string): string {
    this.data[key] = value;
    return value;
  },

  Rename(sourceKey: string, targetKey: string): boolean {
    if (this.data[sourceKey] !== undefined) {
      this.data[targetKey] = this.data[sourceKey];
      delete this.data[sourceKey];
      return true;
    }
    return false;
  },

  Delete(key: string): boolean {
    if (this.data[key] !== undefined) {
      delete this.data[key];
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
    if (this.data[key]) {
      this.data[key] += value; // Append value to existing data
    } else {
      this.data[key] = value; // If key doesn't exist, create it
    }
  },
};

export const scriptProcessors = fs
  .readdirSync(__dirname)
  .filter((file) => /^parse_.*\.ts$/.test(file))
  .map((file) => {
    return {
      processorId: path.basename(file, '.ts'),
      commonName: path
        .basename(file, '.ts')
        .replace(/_./g, (match) => match[1].toUpperCase()),
      fileContent: fs.readFileSync(path.join(__dirname, file), 'utf8'),
    };
  })
  .map(({ processorId, fileContent, commonName }) => {
    const { outputText: transpiledCode } = ts.transpileModule(fileContent, {
      compilerOptions: {
        target: ts.ScriptTarget.ES5,
        module: ts.ModuleKind.CommonJS,
        removeComments: true,
      },
    });

    if (!transpiledCode) {
      throw new Error(`Transpilation failed for file: ${processorId}`);
    } else {
      return {
        processorId,
        commonName,
        transpiledCode,
      };
    }
  })
  .map(({ processorId, transpiledCode, commonName }) => {
    const context = vm.createContext({
      module: { exports: {} },
      exports: {},
      require,
      dummyEvent,
    });

    vm.runInContext(transpiledCode, context);

    if (typeof context[commonName] === 'function') {
      context[commonName](context.dummyEvent);
      if (context[`${commonName}Pattern`]) {
        return {
          script: {
            when: {
              regexp: {
                message: context[`${commonName}Pattern`]
                  .toString()
                  .slice(
                    1,
                    context[`${commonName}Pattern`].toString().endsWith('/g')
                      ? -2
                      : -1,
                  )
                  .replace(/\\u00/g, '\\\\u0000'),
              },
            },
            lang: 'javascript',
            id: processorId,
            source: transpiledCode.replaceAll(commonName, 'process'),
          },
        };
      } else {
        throw new Error(`Invalid data encountered in file: ${processorId}`);
      }
    } else {
      throw new Error(`'process' function not found in file: ${processorId}`);
    }
  });
