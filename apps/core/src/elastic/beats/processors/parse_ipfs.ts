import { FilebeatEvent } from './event';

const parseIpfsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  dpanic: 'critical',
  fatal: 'critical',
};

const parseIpfsPattern =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(DEBUG|INFO|WARN|ERROR|DPANIC|FATAL)\s+(.*)$/;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseIpfs(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseIpfsPattern);
  if (logMatch) {
    event.Put(
      'log.level',
      parseIpfsLevels[logMatch[2]?.toLowerCase()] || 'unknown',
    );
    event.Put('message', logMatch[3]);
  }
}
