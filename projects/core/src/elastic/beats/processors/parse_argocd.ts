/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that maps the level and message of an Argo CD logfmt line onto ECS fields.
 */
// @ts-expect-error since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  /^time="(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"\s+level=(debug|info|warn|error)\s+msg="([^"]+)"/;

/**
 * Maps the level and message of an Argo CD logfmt line onto ECS fields.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: time="2025-01-29T01:51:43Z" level=info msg="finished unary call with code OK"
 * processLog(event);
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line unused-imports/no-unused-vars, @typescript-eslint/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[2]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[3]);
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
