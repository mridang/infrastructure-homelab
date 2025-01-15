import * as k8s from '@pulumi/kubernetes';
import { cloudflareSecret } from './cloudflare';
import provider from './provider';

new k8s.helm.v3.Release(
  'external-dns',
  {
    name: 'external-dns',
    chart: 'external-dns',
    version: '1.15.0',
    namespace: 'kube-system',
    repositoryOpts: {
      repo: 'https://kubernetes-sigs.github.io/external-dns/',
    },
    values: {
      envFrom: [
        {
          secretRef: {
            name: cloudflareSecret.metadata.name,
          },
        },
      ],
      provider: 'cloudflare',
      proxy: 'false',
      sources: ['traefik-proxy'],
    },
  },
  {
    provider,
  },
);
