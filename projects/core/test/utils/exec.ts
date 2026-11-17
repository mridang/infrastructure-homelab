import { exec, execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import type { SpawnOptions } from 'node:child_process';

export const execAsync = promisify(exec);
export const execFileAsync = promisify(execFile);

export async function run(
  command: string,
  args: readonly string[],
  options: SpawnOptions = {},
): Promise<number> {
  const child = spawn(command, args, options);
  await once(child, 'close');
  return child.exitCode ?? 1;
}
