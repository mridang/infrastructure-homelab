import { FilebeatEvent } from './event';

const parseTraefikLevels: Record<string, string> = {
  trc: 'debug',
  dbg: 'debug',
  inf: 'info',
  wrn: 'warn',
  err: 'error',
  ftl: 'critical',
  pnc: 'critical',
};

const parseTraefikPattern =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(TRC|DBG|INF|WRN|ERR|FTL|PNC)\s+(.*)$/;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseTraefik(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseTraefikPattern);
  if (logMatch) {
    event.Put(
      'log.level',
      parseTraefikLevels[logMatch[2]?.toLowerCase()] || 'unknown',
    );
    event.Put('message', logMatch[3]);
  }
}
