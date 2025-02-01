// @ts-expect-error since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  trc: 'debug',
  dbg: 'debug',
  inf: 'info',
  wrn: 'warn',
  err: 'error',
  ftl: 'critical',
  pnc: 'critical',
};

// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(TRC|DBG|INF|WRN|ERR|FTL|PNC)\s+(.*)$/;

// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[2]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[3]);
  }
}
