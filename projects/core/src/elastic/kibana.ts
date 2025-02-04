import * as k8s from '@pulumi/kubernetes';
import { ELASTIC_VERSION } from './constants';
import provider from '../provider';
import { elasticsearch } from './elastic';
import { interpolate } from '@pulumi/pulumi';
import { settings } from '../settings';
import { traefik } from '../traefik';

export const kibana = new k8s.apiextensions.CustomResource('kibana-instance', {
  apiVersion: 'kibana.k8s.elastic.co/v1',
  kind: 'Kibana',
  metadata: { name: 'my-kibana' },
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

new k8s.apiextensions.CustomResource(
  'kibana-ingressroute',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'IngressRoute',
    metadata: {
      name: 'kibana-ingressroute',
      namespace: 'default',
    },
    spec: {
      entryPoints: ['websecure'],
      routes: [
        {
          match: `Host(\`kibana.${settings.clusterDomain}\`)`,
          kind: 'Rule',
          services: [
            {
              name: interpolate`${kibana.metadata.name}-kb-http`,
              port: 5601,
            },
          ],
        },
      ],
      tls: {
        certResolver: 'letsencrypt',
      },
    },
  },
  {
    provider,
    dependsOn: [traefik],
  },
);

new k8s.networking.v1.Ingress(
  'tailscale-kibana-ingress',
  {
    metadata: {
      name: 'tailscale-kibana-ingress',
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
    dependsOn: elasticsearch,
  },
);
