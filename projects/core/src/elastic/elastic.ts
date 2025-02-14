import * as k8s from '@pulumi/kubernetes';
import { ELASTIC_VERSION } from './constants';
import provider from '../provider';
import { interpolate } from '@pulumi/pulumi';
import { tailscale } from '../tailscale';
import { settings } from '../settings';

export const elasticsearch = new k8s.apiextensions.CustomResource(
  'elasticsearch-cluster',
  {
    apiVersion: 'elasticsearch.k8s.elastic.co/v1',
    kind: 'Elasticsearch',
    metadata: {
      name: 'my-cluster',
      annotations: {
        'pulumi.com/patchForce': 'true',
        'pulumi.com/waitFor': 'jsonpath={.status.phase}=Ready',
      },
    },
    spec: {
      version: ELASTIC_VERSION,
      http: {
        tls: {
          selfSignedCertificate: {
            disabled: true,
          },
        },
      },
      nodeSets: [
        {
          name: 'default',
          count: 1,
          config: {
            'node.store.allow_mmap': 'false',
          },
          volumeClaimTemplates: [
            {
              metadata: { name: 'elasticsearch-data' },
              spec: {
                accessModes: ['ReadWriteOnce'],
                storageClassName: 'hostpath',
                resources: { requests: { storage: '10Gi' } },
              },
            },
          ],
        },
      ],
    },
  },
);

new k8s.networking.v1.Ingress(
  'tailscale-elasticsearch-ingress',
  {
    metadata: {
      name: 'tailscale-elasticsearch-ingress',
      annotations: {
        // Must be declared in the tailnet policy
        'tailscale.com/tags': [`tag:env-${settings.environmentName}`].join(','),
      },
    },
    spec: {
      ingressClassName: 'tailscale',
      defaultBackend: {
        service: {
          name: interpolate`${elasticsearch.metadata.name}-es-http`,
          port: {
            number: 9200,
          },
        },
      },
      tls: [
        {
          hosts: ['elastic'],
        },
      ],
    },
  },
  {
    provider,
    dependsOn: [tailscale, elasticsearch],
  },
);
