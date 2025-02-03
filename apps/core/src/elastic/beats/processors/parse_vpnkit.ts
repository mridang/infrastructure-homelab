import { FilebeatEvent } from './event';

const parseVpnKitLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  error: 'error',
  panic: 'critical',
  fatal: 'critical',
};

const parseVpnkitPattern =
  /^time="([^"]+)"\s+level=(debug|info|warning|error|panic|fatal)\s+msg="([^"]+)"$/;

/**
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 *
 * @param event
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseVpnkit(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseVpnkitPattern);
  if (logMatch) {
    event.Put(
      'log.level',
      parseVpnKitLevels[logMatch[2]?.toLowerCase()] || 'unknown',
    );
    event.Put('message', logMatch[3]);
  }
}
