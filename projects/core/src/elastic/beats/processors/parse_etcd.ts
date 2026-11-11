/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that removes the hash field from an etcd event whose message mentions a hash.
 */
// @ts-expect-error since this is not actually declared multiple times
const logPattern = /\shash/;

/**
 * Removes the hash field from an etcd event whose message mentions a hash.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: a message containing " hash", such as an etcd snapshot hash report
 * processLog(event);
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line unused-imports/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Delete('hash');
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
