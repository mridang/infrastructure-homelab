/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that strips the date and time from a Tailscale log line and sets its level to info.
 */
// @ts-expect-error since this is not actually declared multiple times
const logPattern = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+((?:\S.*)?)$/;

/**
 * Strips the date and time from a Tailscale log line and sets its level to info.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: 2025/01/20 02:48:34 magicsock: derp-3 connected; connGen=1
 * processLog(event);
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('message', logMatch[2]);
    event.Put('log.level', 'info');
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
