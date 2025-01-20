var ecsLevels = {
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  error: 'error',
  panic: 'critical',
  fatal: 'critical',
};

var regexLevel =
  /^time="([^"]+)"\s+level=(debug|info|warning|error|panic|fatal)\s+msg="([^"]+)"$/;

/**
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 * time="2025-01-20T15:01:53Z" level=error msg="Port 443 for service traefik is already opened by another service"
 *
 * @param event
 */
function process(event) {
  var logMatch = event.Get('message').match(regexLevel);
  if (logMatch) {
    var logLevel = logMatch[2];
    if (ecsLevels[logLevel]) {
      event.Put('log_level', ecsLevels[logLevel]);
    } else {
      event.Put('log_level', 'unknown');
    }
    event.Put('message', logMatch[3]);
  }
}
