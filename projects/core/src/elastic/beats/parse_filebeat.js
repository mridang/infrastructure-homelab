var ecsLevels = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  dpanic: 'critical', // Mapping DPanic to 'critical' as it's typically treated as a serious issue.
  panic: 'critical', // Mapping Panic to 'critical'.
  fatal: 'critical', // Mapping Fatal to 'critical'.
};

var regexLevel = /^\[(debug|info|warn|error|dpanic|panic|fatal)\]\s+(.+)$/;

/**
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 *
 * @param event
 */
function process(event) {
  var logMatch = event.Get('message').match(regexLevel);
  if (logMatch) {
    var logLevel = logMatch[1];
    if (ecsLevels[logLevel]) {
      event.Put('log_level', ecsLevels[logLevel]);
    } else {
      event.Put('log_level', 'unknown');
    }
    event.Put('message', logMatch[2]);
  }
}
