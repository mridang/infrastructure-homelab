// @ts-ignore since this is not actually declared multiple times
const logPattern = /.*\shash.*/;

// @ts-ignore the unused warning since this method is actually used
function process(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Delete('hash');
  }
}
