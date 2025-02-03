import { FilebeatEvent } from './event';

const parseKlogLevels: Record<string, string> = {
  i: 'info',
  w: 'warn',
  e: 'error',
  f: 'critical',
};

const parseKlogPattern =
  /^([IWEF])(\d{4} \d{2}:\d{2}:\d{2}\.\d+)\s+\d+\s+.*?]\s(.*)$/;

/**
 * I0117 07:28:57.028111       1 controller.go:1293] provision "default/elasticsearch-data-my-cluster-es-default-0" class "hostpath": volume "pvc-38511ace-7194-496b-b3a4-0df77072775f" provisioned
 * I0117 07:28:57.028123       1 controller.go:1310] provision "default/elasticsearch-data-my-cluster-es-default-0" class "hostpath": succeeded
 * I0117 07:28:57.028132       1 volume_store.go:212] Trying to save persistentvolume "pvc-38511ace-7194-496b-b3a4-0df77072775f"
 * I0117 07:28:57.030812       1 volume_store.go:219] persistentvolume "pvc-38511ace-7194-496b-b3a4-0df77072775f" saved
 *
 * @param event
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseKlog(event: FilebeatEvent): void {
  const logMatch = event.Get<string>('message')?.match(parseKlogPattern);
  if (logMatch) {
    event.Put(
      'log.level',
      parseKlogLevels[logMatch[1]?.toLowerCase()] || 'unknown',
    );
    event.Put('message', logMatch[3]);
  }
}
