/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that removes ANSI colour escape sequences from the event message.
 */
const logPattern =
  /[\u001B\u009B][[()#;?]*(?:\d{1,4}(?:;\d{0,4})*)?[0-9A-ORZcf-nqry=><]/gu; // eslint-disable-line no-control-regex, sonarjs/no-control-regex -- ANSI escape sequences are matched on purpose

/**
 * Removes ANSI colour escape sequences from the event message.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: a message wrapped in terminal colour codes, such as an ANSI-coloured error
 * processLog(event);
 */
// eslint-disable-next-line unused-imports/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: BeatsEvent): void {
  const message = event.Get<string>('message');
  if (message) {
    event.Put('message', message.replaceAll(logPattern, ''));
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
