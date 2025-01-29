var ecsLevels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const regexLevel =
  /^time="(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)"\s+level=(debug|info|warn|error)\s+msg="([^"]+)"/;

/**
 * time="2025-01-29T01:51:43Z" level=info msg="finished unary call with code OK" grpc.code=OK grpc.method=Check grpc.service=grpc.health.v1.Health grpc.start_time="2025-01-29T01:51:43Z" grpc.time_ms=0.017 span.kind=server system=grpc
 *
 * @param event
 */
function process(event) {
  var logMatch = event.Get('message').match(regexLevel);
  if (logMatch) {
    var logLevel = logMatch[2];
    if (ecsLevels[logLevel]) {
      event.Put('log.level', ecsLevels[logLevel]);
    } else {
      event.Put('log.level', 'unknown');
    }
    event.Put('message', logMatch[3]);
  }
}
