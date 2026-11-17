/**
 * @file Deploys a Kibana instance connected to Elasticsearch and a Tailscale ingress for it.
 */
import { apiextensions, networking } from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import provider from '../provider';
import { tailscale } from '../tailscale';
import { settings } from '../settings';
import { elasticsearch } from './elastic';
import { ELASTIC_VERSION } from './constants';

export const kibana = new apiextensions.CustomResource('kibana-instance', {
  apiVersion: 'kibana.k8s.elastic.co/v1',
  kind: 'Kibana',
  metadata: {
    name: 'my-kibana',
    annotations: {
      'pulumi.com/waitFor': 'jsonpath={.status.health}=green',
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
    count: 1,
    elasticsearchRef: { name: elasticsearch.metadata.name },
    config: {
      logging: {
        appenders: {
          jason: {
            type: 'console',
            layout: {
              type: 'json',
            },
          },
        },
        loggers: [
          {
            name: 'root',
            appenders: ['jason'],
            level: 'info',
          },
        ],
      },
      'xpack.fleet.packages': [
        {
          name: 'apm',
          version: 'latest',
        },
      ],
    },
  },
});

// eslint-disable-next-line no-new -- a Pulumi resource registers itself on construction
new networking.v1.Ingress(
  'tailscale-kibana-ingress',
  {
    metadata: {
      name: 'tailscale-kibana-ingress',
      annotations: {
        'pulumi.com/patchForce': 'true',
        // Must be declared in the tailnet policy
        'tailscale.com/tags': [`tag:env-${settings.environmentName}`].join(','),
      },
    },
    spec: {
      ingressClassName: 'tailscale',
      defaultBackend: {
        service: {
          name: interpolate`${kibana.metadata.name}-kb-http`,
          port: {
            number: 5601,
          },
        },
      },
      tls: [
        {
          hosts: ['kibana'],
        },
      ],
    },
  },
  {
    provider,
    dependsOn: [tailscale, elasticsearch],
  },
);
