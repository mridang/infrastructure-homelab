/**
 * 2025/01/20 02:48:34 netcheck: UDP is blocked, trying ICMP
 * 2025/01/20 02:48:34 magicsock: derp-3 connected; connGen=1
 * 2025/01/20 02:48:34 health(warnable=no-derp-connection): ok
 * 2025/01/20 02:49:01 control: map response long-poll timed out!
 * 2025/01/20 02:49:01 Received error: PollNetMap: context canceled
 * 2025/01/20 02:49:57 control: controlhttp: forcing port 443 dial due to recent noise dial
 * 2025/01/20 02:49:57 control: controlhttp: forcing port 443 dial due to recent noise dial
 * 2025/01/20 02:49:57 [RATELIMIT] format("control: controlhttp: forcing port 443 dial due to recent noise dial")
 * 2025/01/20 02:49:58 control: netmap: got new dial plan from control
 * 2025/01/20 02:49:58 health(warnable=not-in-map-poll): ok
 */

// @ts-expect-error since this is not actually declared multiple times
const logPattern = /^(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})\s+(.*)$/;

// @ts-expect-error the unused warning since this method is actually used
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processLog(event: Event): void {
  const logMatch = event.Get<string>('message')?.match(logPattern);
  if (logMatch) {
    event.Put('message', logMatch[2]);
    event.Put('log.level', 'info');
  }
}
