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
const logPattern = /^\[(debug|info|warn|error|dpanic|panic|fatal)\]\s+(.+)$/;

/**
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 *
 * @param event
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[1]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[2]);
  }
}
