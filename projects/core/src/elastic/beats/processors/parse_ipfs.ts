/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that maps the timestamped level and text of an IPFS log line onto ECS fields.
 */
// eslint-disable-next-line tslop/no-known-value-widening -- the level is looked up by a string captured from the log line, so the dictionary must stay open
const ecsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  dpanic: 'critical',
  fatal: 'critical',
};

const logPattern =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(DEBUG|INFO|WARN|ERROR|DPANIC|FATAL)\s+((?:\S.*)?)$/u;

/**
 * Maps the timestamped level and text of an IPFS log line onto ECS fields.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: 2025-01-20T15:01:53.123Z INFO swarm listening on /ip4/0.0.0.0/tcp/4001
 * processLog(event);
 */
// eslint-disable-next-line unused-imports/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: BeatsEvent): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[2]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[3]);
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
