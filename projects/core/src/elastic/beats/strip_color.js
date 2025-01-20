var regex =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

function process(event) {
  var msg = event.Get('message');
  event.Put('message', msg.replace(regex, ''));
}
