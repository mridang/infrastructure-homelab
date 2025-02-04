import { FilebeatEvent } from './event';

const parseEtcdPattern = /.*\shash.*/;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseEtcd(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseEtcdPattern);
  if (logMatch) {
    event.Delete('hash');
  }
}
