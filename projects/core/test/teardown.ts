/**
 * @file Global Jest teardown that deletes the KinD cluster created by the setup.
 */
import { execSync } from 'node:child_process';

/**
 * Deletes the KinD cluster used by the integration tests, or aborts the run when that fails.
 * @throws {Error} When the KinD cluster cannot be deleted.
 * @example
 * // Jest calls this once, after the last test file has finished.
 * teardown();
 */
export default function teardown(): void {
  try {
    console.log('Deleting KinD cluster...');
    // eslint-disable-next-line n/no-sync, sonarjs/no-os-command-from-path -- sync is fine in a script/bootstrap, and kind is a devbox-provided tool
    execSync('kind delete cluster --name=homelab-dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error during global teardown:', error);
    throw new Error('Global teardown failed to delete the KinD cluster.');
  }
}
