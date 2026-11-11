/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that maps the timestamped level and text of an IPFS log line onto ECS fields.
 */
// @ts-expect-error since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  dpanic: 'critical',
  fatal: 'critical',
};

// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  // eslint-disable-next-line sonarjs/super-linear-regex -- anchored to one log line, so backtracking stays bounded
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(DEBUG|INFO|WARN|ERROR|DPANIC|FATAL)\s+(.*)$/;

/**
 * Maps the timestamped level and text of an IPFS log line onto ECS fields.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: 2025-01-20T15:01:53.123Z INFO swarm listening on /ip4/0.0.0.0/tcp/4001
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
