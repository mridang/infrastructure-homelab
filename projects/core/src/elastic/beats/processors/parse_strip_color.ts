/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that removes ANSI colour escape sequences from the event message.
 */
// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  /[\u001B\u009B][[()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-ORZcf-nqry=><]/g; // eslint-disable-line no-control-regex, sonarjs/no-control-regex -- ANSI escape sequences are matched on purpose

/**
 * Removes ANSI colour escape sequences from the event message.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: a message wrapped in terminal colour codes, such as an ANSI-coloured error
 * processLog(event);
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line unused-imports/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: Event): void {
  const message = event.Get<string>('message');
  if (message) {
    event.Put('message', message.replaceAll(logPattern, ''));
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
