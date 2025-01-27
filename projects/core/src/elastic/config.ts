import * as k8s from '@pulumi/kubernetes';
import { elasticsearch } from './elastic';
import { kibana } from './kibana';
import provider from '../provider';

new k8s.apiextensions.CustomResource(
  'elk-config',
  {
    apiVersion: 'stackconfigpolicy.k8s.elastic.co/v1alpha1',
    kind: 'StackConfigPolicy',
    metadata: {
      name: 'elk-config',
    },
    spec: {
      elasticsearch: {
        indexTemplates: {
          composableIndexTemplates: {
            'disable-replication': {
              index_patterns: ['*'],
              template: {
                settings: {
                  number_of_replicas: 0,
                },
              },
              composed_of: [],
              priority: 999,
              data_stream: {
                hidden: false,
                allow_custom_routing: false,
              },
            },
          },
        },
      },
    },
  },
  { provider, dependsOn: [elasticsearch, kibana] },
);
