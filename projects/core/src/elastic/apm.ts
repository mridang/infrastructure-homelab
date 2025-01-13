import * as k8s from '@pulumi/kubernetes';
import { ELASTIC_VERSION } from './constants';
import provider from '../provider';
import { elasticsearchCluster } from './elastic';

new k8s.apiextensions.CustomResource(
  'apm-server-instance',
  {
    apiVersion: 'apm.k8s.elastic.co/v1',
    kind: 'ApmServer',
    metadata: {
      name: 'my-apm-server',
    },
    spec: {
      version: ELASTIC_VERSION,
      http: {
        tls: {
          selfSignedCertificate: {
            disabled: true, //Secret token is set, but SSL is not enabled
          },
        },
      },
      count: 1,
      elasticsearchRef: { name: elasticsearchCluster.metadata.name },
      config: {
        'apm-server.rum.enabled': 'true',
        'apm-server.rum.allowed_origins': ['*'],
      },
    },
  },
  {
    provider,
  },
);

new k8s.networking.v1.Ingress(
  'tailscale-apm-ingress',
  {
    metadata: {
      name: 'tailscale-apm-ingress',
    },
    spec: {
      ingressClassName: 'tailscale',
      defaultBackend: {
        service: {
          name: 'my-apm-server-apm-http',
          port: {
            number: 8200,
          },
        },
      },
      tls: [
        {
          hosts: ['apm'],
        },
      ],
    },
  },
  {
    provider,
    dependsOn: elasticsearchCluster,
  },
);
