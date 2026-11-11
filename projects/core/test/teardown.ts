/**
 * @file Global Jest teardown that deletes the KinD cluster created by the setup.
 */
import { run } from './utils/exec';

/**
 * Deletes the KinD cluster used by the integration tests, or aborts the run when that fails.
 * @throws {Error} When the KinD cluster cannot be deleted.
 * @example
 * // Jest calls this once, after the last test file has finished.
 * await teardown();
 */
export default async function teardown(): Promise<void> {
  try {
    console.log('Deleting KinD cluster...');
    const code = await run(
      'kind',
      ['delete', 'cluster', '--name=homelab-dev'],
      {
        stdio: 'inherit',
      },
    );
    if (code !== 0) {
      throw new Error(`kind exited with code ${code}`);
    }
  } catch (error) {
    console.error('Error during global teardown:', error);
    throw new Error('Global teardown failed to delete the KinD cluster.');
  }
}
