import { FilebeatEvent } from './event';

const parseFilebeatLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  dpanic: 'critical',
  panic: 'critical',
  fatal: 'critical',
};

const parseFilebeatPattern =
  /^\[(debug|info|warn|error|dpanic|panic|fatal)\]\s+(.+)$/;

/**
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 *
 * @param event
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseFilebeat(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseFilebeatPattern);
  if (logMatch) {
    event.Put(
      'log.level',
      parseFilebeatLevels[logMatch[1]?.toLowerCase()] || 'unknown',
    );
    event.Put('message', logMatch[2]);
  }
}
