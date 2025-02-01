// @ts-expect-error since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  error: 'error',
  panic: 'critical',
  fatal: 'critical',
};

// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  /^time="([^"]+)"\s+level=(debug|info|warning|error|panic|fatal)\s+msg="([^"]+)"$/;

/**
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 *
 * @param event
 */
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
