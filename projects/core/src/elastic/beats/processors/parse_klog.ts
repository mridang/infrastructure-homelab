/* eslint-disable unicorn/filename-case -- the processor id is the file name, so renaming it would change the Beats processor id */

/**
 * @file Beats script processor that maps the severity letter and message of a klog line onto ECS fields.
 */
// @ts-expect-error since this is not actually declared multiple times
const ecsLevels = {
  i: 'info',
  w: 'warn',
  e: 'error',
  f: 'critical',
};

// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  // eslint-disable-next-line sonarjs/super-linear-regex -- the overlapping whitespace and wildcard have no exactly equivalent non-overlapping form, and the input is one log line
  /^([IWEF])(\d{4} \d{2}:\d{2}:\d{2}\.\d+)\s+\d+\s+.*?]\s(.*)$/;

/**
 * Maps the severity letter and message of a klog line onto ECS fields.
 * @param event - The Beats event whose message field holds the log line.
 * @example
 * // Input: I0117 07:28:57.028132       1 volume_store.go:212] Trying to save persistentvolume
 * processLog(event);
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line unused-imports/no-unused-vars, sonarjs/declarations-in-global-scope -- processLog is called by the processors index through a vm context
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[1]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[3]);
  }
}
/* eslint-enable unicorn/filename-case -- end of the file-wide filename exemption */
