// @ts-expect-error since this is not actually declared multiple times
const ecsLevels: Record<string, string> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  /^time="(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"\s+level=(debug|info|warn|error)\s+msg="([^"]+)"/;

/**
 * time="2025-01-29T01:51:43Z" level=info msg="finished unary call with code OK" grpc.code=OK grpc.method=Check grpc.service=grpc.health.v1.Health grpc.start_time="2025-01-29T01:51:43Z" grpc.time_ms=0.017 span.kind=server system=grpc
 *
 * @param event
 */
// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('log.level', ecsLevels[logMatch[2]?.toLowerCase()] || 'unknown');
    event.Put('message', logMatch[3]);
  }
}
