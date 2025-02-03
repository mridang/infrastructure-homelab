// @ts-expect-error since this is not actually declared multiple times
const logPattern =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g; // eslint-disable-line no-control-regex

// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processLog(event: Event): void {
  const message = event.Get<string>('message');
  if (message) {
    event.Put('message', message.replace(logPattern, ''));
  }
}
