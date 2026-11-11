/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that maps the bracketed level and text of a Filebeat log line onto ECS fields.
 */
// @ts-expect-error since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  dpanic: 'critical',
  panic: 'critical',
  fatal: 'critical',
};

// @ts-expect-error since this is not actually declared multiple times
// eslint-disable-next-line sonarjs/super-linear-regex -- anchored to one log line, so backtracking stays bounded
const logPattern = /^\[(debug|info|warn|error|dpanic|panic|fatal)\]\s+(.+)$/;

/**
 * Maps the bracketed level and text of a Filebeat log line onto ECS fields.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: [error] Port 443 for service traefik is already opened by another service
 * processLog(event);
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[1]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[2]);
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
