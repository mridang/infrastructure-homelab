import * as k8s from '@pulumi/kubernetes';
import { ELASTIC_VERSION } from './constants';
import provider from '../provider';
import { interpolate } from '@pulumi/pulumi';

export const elasticsearch = new k8s.apiextensions.CustomResource(
  'elasticsearch-cluster',
  {
    apiVersion: 'elasticsearch.k8s.elastic.co/v1',
    kind: 'Elasticsearch',
    metadata: {
      name: 'my-cluster',
      annotations: {
        'pulumi.com/patchForce': 'true',
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
    dependsOn: elasticsearch,
  },
);
