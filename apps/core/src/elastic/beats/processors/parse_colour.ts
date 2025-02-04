import { FilebeatEvent } from './event';

const parseColourPattern =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g; // eslint-disable-line no-control-regex

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseColour(event: FilebeatEvent): void {
  const message = event.Get<string>('message');
  if (message) {
    event.Put('message', message.replace(parseColourPattern, ''));
  }
}
