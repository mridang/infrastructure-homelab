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
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(debug|info|warn|error|dpanic|fatal)\s+(.*)$/;

// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function process(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    const logLevel = logMatch[2];
    if (ecsLevels[logLevel]) {
      event.Put('log.level', ecsLevels[logLevel]);
    } else {
      event.Put('log.level', 'unknown');
    }
    event.Put('message', logMatch[3]);
  }
}
