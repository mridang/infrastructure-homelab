var ecsLevels = {
  I: 'info', // Map klog info level to ECS info
  W: 'warn', // Map klog warn level to ECS warn
  E: 'error', // Map klog error level to ECS error
  F: 'critical', // Map klog fatal level to ECS critical
};

var regexLevel = /^[IWEF](\d{4} \d{2}:\d{2}:\d{2}\.\d+)\s+\d+\s+.*?]\s(.*)$/;

/**
 * I0117 07:28:57.028111       1 controller.go:1293] provision "default/elasticsearch-data-my-cluster-es-default-0" class "hostpath": volume "pvc-38511ace-7194-496b-b3a4-0df77072775f" provisioned
 * I0117 07:28:57.028123       1 controller.go:1310] provision "default/elasticsearch-data-my-cluster-es-default-0" class "hostpath": succeeded
 * I0117 07:28:57.028132       1 volume_store.go:212] Trying to save persistentvolume "pvc-38511ace-7194-496b-b3a4-0df77072775f"
 * I0117 07:28:57.030812       1 volume_store.go:219] persistentvolume "pvc-38511ace-7194-496b-b3a4-0df77072775f" saved
 *
 * @param event
 */
function process(event) {
  var logMatch = event.Get('message').match(regexLevel);
  if (logMatch) {
    var klogLevel = logMatch[0][0]; // Extract klog level (I, W, E, F)
    var ecsLevel = ecsLevels[klogLevel] || 'unknown'; // Map klog level to ECS level

    // Set the ECS level
    event.Put('log_level', ecsLevel);

    // Extract and set the message
    event.Put('message', logMatch[2]);
  }
}
