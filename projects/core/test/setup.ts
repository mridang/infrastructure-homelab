/**
 * @file Global Jest setup that points Pulumi at a temporary backend and creates a KinD cluster.
 */
import { config } from 'dotenv';
import { mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { run } from './utils/exec';

config();
process.env.PULUMI_CONFIG_PASSPHRASE = 'insecure';

/**
 * Creates the KinD cluster used by the integration tests, or aborts the run when that fails.
 * @throws {Error} When the KinD cluster cannot be created.
 * @example
 * // Jest calls this once, before the first test file runs.
 * await setup();
 */
export default async function setup(): Promise<void> {
  process.env.PULUMI_BACKEND_URL = `file://${await mkdtemp(path.join(tmpdir(), 'pulumi-'))}`;
  try {
    console.log('Creating KinD cluster...');
    const code = await run(
      'kind',
      ['create', 'cluster', '--name=homelab-dev'],
      {
        stdio: 'inherit',
      },
    );
    if (code !== 0) {
      throw new Error(`kind exited with code ${code}`);
    }
  } catch (error) {
    console.error('Error during global setup:', error);
    throw new Error('Global setup failed to create the KinD cluster.');
  }
}
