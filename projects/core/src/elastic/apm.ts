import * as k8s from '@pulumi/kubernetes';
import { ELASTIC_VERSION } from './constants';
import provider from '../provider';
import { elasticsearchCluster } from './elastic';
import { interpolate } from '@pulumi/pulumi';

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
      elasticsearchRef: { name: elasticsearchCluster.metadata.name },
      config: {
        'apm-server.rum.enabled': 'true',
        'apm-server.rum.allowed_origins': ['*'],
        'apm-server.auth.anonymous.enabled': 'true',
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
    dependsOn: elasticsearchCluster,
  },
);

export const apmServerUrl = apmServer.metadata.apply((metadata) => {
	const apmToken = k8s.core.v1.Secret.get("apmToken", `${metadata.namespace}/${metadata.name}-apm-token`, { provider });

  return apmToken.data.apply((data) => {
    const token = Buffer.from(data['secret-token'], 'base64').toString();
    return interpolate`http://${metadata.name}-apm-http.${metadata.namespace}.svc.cluster.local:${APM_PORT}?access_token=${token}`;
  });
});
