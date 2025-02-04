import * as k8s from '@pulumi/kubernetes';
import { ELASTIC_VERSION } from './constants';
import provider from '../provider';
import { elasticsearch } from './elastic';
import { interpolate } from '@pulumi/pulumi';
import { settings } from '../settings';
import { traefik } from '../traefik';
import { tailscale } from '../tailscale';

const APM_PORT = 8200;

const apmServer = new k8s.apiextensions.CustomResource(
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
      elasticsearchRef: { name: elasticsearch.metadata.name },
      config: {
        'apm-server.rum.enabled': 'true',
        'apm-server.rum.allowed_origins': ['*'],
        'apm-server.auth.anonymous.enabled': 'true',
        'apm-server.auth.secret_token': '',
      },
    },
  },
  {
    provider,
  },
);

new k8s.apiextensions.CustomResource(
  'rum-ingressroute',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'IngressRoute',
    metadata: {
      name: 'rum-ingressroute',
      namespace: 'default',
    },
    spec: {
      entryPoints: ['websecure'],
      routes: [
        {
          match: `Host(\`rum.${settings.clusterDomain}\`) && (Path(\`/intake/v2/rum/events\`) || Path(\`/intake/v3/rum/events\`))`,
          kind: 'Rule',
          services: [
            {
              name: interpolate`${apmServer.metadata.name}-apm-http`,
              port: 8200,
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
  'tailscale-apm-ingress',
  {
    metadata: {
      name: 'tailscale-apm-ingress',
    },
    spec: {
      ingressClassName: 'tailscale',
      defaultBackend: {
        service: {
          name: interpolate`${apmServer.metadata.name}-apm-http`,
          port: {
            number: APM_PORT,
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
    dependsOn: [tailscale, elasticsearch],
  },
);

export const apmServerUrl = interpolate`http://${apmServer.metadata.name}-apm-http.${apmServer.metadata.namespace}.svc.cluster.local:${APM_PORT}`;
