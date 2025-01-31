// @ts-ignore since this is not actually declared multiple times
const logPattern =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

// @ts-ignore the unused warning since this method is actually used
function process(event: Event): void {
  const message = event.Get<string>('message');
  if (message) {
    event.Put('message', message.replace(logPattern, ''));
  }
}
