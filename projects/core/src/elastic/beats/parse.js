var ecsLevels = {
  TRC: 'debug',
  DBG: 'debug',
  INF: 'info',
  WRN: 'warn',
  ERR: 'error',
  FTL: 'critical',
  PNC: 'critical',
};

var regexLevel =
  /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s+(TRC|DBG|INF|WRN|ERR|FTL|PNC)\s+(.*)$/;

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
