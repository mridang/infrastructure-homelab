/**
 * @file Global Jest teardown for the repository, which has no environment to clean up.
 */

/**
 * Global Jest teardown hook that performs no work for this repository.
 * @example
 * // Jest awaits this after the last test file has finished.
 * await teardown();
 */
export default async function teardown(): Promise<void> {
  // no-op
}
