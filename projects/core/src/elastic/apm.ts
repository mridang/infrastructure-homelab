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
