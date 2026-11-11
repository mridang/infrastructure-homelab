import { exec, execFile, spawn, type SpawnOptions } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';

export const execAsync = promisify(exec);
export const execFileAsync = promisify(execFile);

export async function run(
  command: string,
  args: readonly string[],
  options: SpawnOptions = {},
): Promise<number> {
  const child = spawn(command, args, options);
  const [code] = (await once(child, 'close')) as [number | null];
  return code ?? 1;
}
