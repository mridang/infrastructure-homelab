import * as k8s from '@pulumi/kubernetes';
import provider from './provider';

new k8s.apps.v1.Deployment('helloworld-deployment', {
  metadata: {
    labels: { app: 'helloworld' },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: { app: 'helloworld' },
    },
    template: {
      metadata: {
        labels: { app: 'helloworld' },
      },
      spec: {
        containers: [
          {
            name: 'helloworld',
            image: 'testcontainers/helloworld:latest',
            ports: [{ containerPort: 8080 }, { containerPort: 8081 }],
          },
        ],
      },
    },
  },
});

const service = new k8s.core.v1.Service('helloworld-service', {
  metadata: {
    labels: { app: 'helloworld' },
  },
  spec: {
    ports: [{ port: 8080, targetPort: 8080, name: 'hello' }],
    selector: { app: 'helloworld' },
  },
});

new k8s.apiextensions.CustomResource(
  'statuspage-subdomain-ingressroute',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'IngressRoute',
    metadata: {
      name: 'statuspage-subdomain-ingressroute',
      namespace: 'default',
    },
    spec: {
      entryPoints: ['websecure'],
      routes: [
        {
          match: 'Host(`status.homelab.mrida.ng`)',
          kind: 'Rule',
          middlewares: [
            {
              name: 'compression-middleware',
            },
          ],
          services: [
            {
              name: service.metadata.name,
              port: 8080,
            },
          ],
        },
      ],
      tls: {
        certResolver: 'letsencrypt',
      },
    },
  },
  { provider },
);
