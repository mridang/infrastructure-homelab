import { FilebeatEvent } from './event';

const parseArgocdLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const parseArgocdPattern =
  /^time="(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"\s+level=(debug|info|warn|error)\s+msg="([^"]+)"/;

/**
 * time="2025-01-29T01:51:43Z" level=info msg="finished unary call with code OK" grpc.code=OK grpc.method=Check grpc.service=grpc.health.v1.Health grpc.start_time="2025-01-29T01:51:43Z" grpc.time_ms=0.017 span.kind=server system=grpc
 *
 * @param event
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseArgocd(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseArgocdPattern);
  if (logMatch) {
    event.Put(
      'log.level',
      parseArgocdLevels[logMatch[2]?.toLowerCase()] || 'unknown',
    );
    event.Put('message', logMatch[3]);
  }
}
