import * as k8s from '@pulumi/kubernetes';

const serviceAccount = new k8s.core.v1.ServiceAccount('image-checker-sa', {
  metadata: {
    name: 'image-checker',
    namespace: 'kube-system',
  },
});

const role = new k8s.rbac.v1.ClusterRole('image-checker-role', {
  metadata: {
    name: 'image-checker-role',
    namespace: 'kube-system',
  },
  rules: [
    {
      apiGroups: [''],
      resources: ['pods'],
      verbs: ['get', 'list', 'patch'],
    },
  ],
});

new k8s.rbac.v1.ClusterRoleBinding('image-checker-rolebinding', {
  metadata: {
    name: 'image-checker-rolebinding',
    namespace: 'kube-system',
  },
  subjects: [
    {
      kind: 'ServiceAccount',
      name: serviceAccount.metadata.name,
      namespace: 'kube-system',
    },
  ],
  roleRef: {
    kind: 'ClusterRole',
    name: role.metadata.name,
    apiGroup: 'rbac.authorization.k8s.io',
  },
});

const controllerScript = new k8s.core.v1.ConfigMap('image-checker-config', {
  metadata: {
    name: 'image-checker-config',
    namespace: 'kube-system',
  },
  data: {
    'index.js': `const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromCluster();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const IMAGE_SIZE_THRESHOLD_MB = 500;

new k8s.Watch(kc)
  .watch(
    '/api/v1/pods',
    { resourceVersion: '0' },
    async (type, pod) => {
      if (type !== 'ADDED' || !pod.metadata?.name || !pod.metadata.namespace) return;

      for (const container of pod.spec?.containers || []) {
        try {
          const imageParts = container.image?.split(':');
          if (!imageParts) continue;

          const repo = imageParts[0];
          const tag = imageParts.length > 1 ? imageParts[1] : 'latest';
          const apiUrl = \`https://hub.docker.com/v2/repositories/\${repo}/tags/\${tag}\`;

          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(\`Failed to fetch image size: \${response.statusText}\`);

          const data = await response.json();
          const imageSizeMB = data.images?.[0]?.size ? data.images[0].size / (1024 * 1024) : 0;
          if (imageSizeMB <= IMAGE_SIZE_THRESHOLD_MB) continue;

          console.log(\`Pod \${pod.metadata.name} has a large image: \${container.image} (\${imageSizeMB} MB)\`);

          await k8sApi.patchNamespacedPod(
            pod.metadata.name,
            pod.metadata.namespace,
            { metadata: { labels: { 'image-size-warning': 'true' } } },
            undefined, // pretty
            undefined, // dryRun
            undefined, // fieldManager
            undefined, // fieldValidation
            undefined, // force
            { headers: { 'Content-Type': 'application/merge-patch+json' } }
          );

          console.log(\`Labeled pod \${pod.metadata.name}\`);
        } catch (err) {
          console.error(\`Error processing image \${container.image}:\`, err);
        }
      }
    },
    (err) => console.error('Watch error:', err)
  )
  .catch(console.error);
`,
  },
});

new k8s.apps.v1.Deployment('image-checker-controller', {
  metadata: {
    name: 'image-checker-controller',
    namespace: 'kube-system',
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'image-checker',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'image-checker',
        },
      },
      spec: {
        serviceAccountName: serviceAccount.metadata.name,
        containers: [
          {
            name: 'controller',
            image: 'node:22',
            command: ['node', '/app/index.js'],
            workingDir: '/app',
            volumeMounts: [{ name: 'script-volume', mountPath: '/app' }],
          },
        ],
        volumes: [
          {
            name: 'script-volume',
            configMap: { name: controllerScript.metadata.name },
          },
        ],
      },
    },
  },
});
