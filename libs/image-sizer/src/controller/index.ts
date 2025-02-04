import k8s from '@kubernetes/client-node';
import { ImageTagInfo } from './types';

const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const IMAGE_SIZE_THRESHOLD_MB = 500;

new k8s.Watch(kc)
  .watch(
    '/api/v1/pods',
    { resourceVersion: '0' },
    async (type: string, pod: k8s.V1Pod) => {
      if (type !== 'ADDED' || !pod.metadata?.name || !pod.metadata.namespace)
        return;

      for (const container of pod.spec?.containers || []) {
        const imageParts = container.image?.split(':');
        if (!imageParts) {
          continue;
        }

        const repo = imageParts[0];
        const tag = imageParts.length > 1 ? imageParts[1] : 'latest';
        const response = await fetch(
          `https://hub.docker.com/v2/repositories/${repo}/tags/${tag}`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch image size: ${response.statusText}`);
        } else {
          const data = (await response.json()) as ImageTagInfo;
          const imageSizeMB = data.images?.[0]?.size
            ? data.images[0].size / (1024 * 1024)
            : 0;
          if (imageSizeMB <= IMAGE_SIZE_THRESHOLD_MB) {
            console.debug(
              `Pod ${pod.metadata.name} has a decent image: ${container.image} (${imageSizeMB} MB)`,
            );
            return;
          } else {
            console.log(
              `Pod ${pod.metadata.name} has a large image: ${container.image} (${imageSizeMB} MB)`,
            );

            await k8sApi.patchNamespacedPod(
              pod.metadata.name,
              pod.metadata.namespace,
              { metadata: { labels: { 'image-size-warning': 'true' } } },
              undefined, // pretty
              undefined, // dryRun
              undefined, // fieldManager
              undefined, // fieldValidation
              undefined, // force
              { headers: { 'Content-Type': 'application/merge-patch+json' } },
            );

            console.log(`Labeled pod ${pod.metadata.name}`);
          }
        }
      }
    },
    (err) => console.error('Watch error:', err),
  )
  .catch(console.error);
