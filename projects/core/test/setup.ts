/**
 * @file Global Jest setup that points Pulumi at a temporary backend and creates a KinD cluster.
 */
import { execSync } from 'node:child_process';
import { config } from 'dotenv';
import { mkdtempSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

config();
// eslint-disable-next-line n/no-sync -- sync is fine in a script/bootstrap, and the directory is made once before tests start
process.env.PULUMI_BACKEND_URL = `file://${mkdtempSync(path.join(tmpdir(), 'pulumi-'))}`;
process.env.PULUMI_CONFIG_PASSPHRASE = 'insecure';

/**
 * Creates the KinD cluster used by the integration tests, or aborts the run when that fails.
 * @throws {Error} When the KinD cluster cannot be created.
 * @example
 * // Jest calls this once, before the first test file runs.
 * setup();
 */
export default function setup(): void {
  try {
    console.log('Creating KinD cluster...');
    // eslint-disable-next-line n/no-sync, sonarjs/no-os-command-from-path -- sync is fine in a script/bootstrap, and kind is a devbox-provided tool
    execSync('kind create cluster --name=homelab-dev', {
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Error during global setup:', error);
    throw new Error('Global setup failed to create the KinD cluster.');
  }
}
