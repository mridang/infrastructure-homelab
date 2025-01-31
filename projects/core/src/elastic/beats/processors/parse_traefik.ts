// @ts-ignore since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  TRC: 'debug',
  DBG: 'debug',
  INF: 'info',
  WRN: 'warn',
  ERR: 'error',
  FTL: 'critical',
  PNC: 'critical',
};

// @ts-ignore since this is not actually declared multiple times
const logPattern =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(TRC|DBG|INF|WRN|ERR|FTL|PNC)\s+(.*)$/;

// @ts-ignore the unused warning since this method is actually used
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
