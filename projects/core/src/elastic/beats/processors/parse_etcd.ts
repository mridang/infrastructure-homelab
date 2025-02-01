// @ts-expect-error since this is not actually declared multiple times
const logPattern = /.*\shash.*/;

// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function process(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Delete('hash');
  }
}
