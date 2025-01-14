import * as k8s from '@pulumi/kubernetes';
import provider from './provider';
import { traefik } from './traefik';

new k8s.helm.v3.Chart(
  'nginx',
  {
    chart: 'nginx',
    version: '18.2.1',
    fetchOpts: {
      repo: 'https://charts.bitnami.com/bitnami',
    },
    values: {
      service: {
        type: 'ClusterIP',
        port: 8080,
      },
      containerPorts: {
        http: 8080,
        https: null,
      },
    },
  },
  { provider },
);

new k8s.apiextensions.CustomResource(
  'nginx-subdomain-ingressroute',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'IngressRoute',
    metadata: {
      name: 'nginx-subdomain-ingressroute',
      namespace: 'default',
    },
    spec: {
      entryPoints: ['websecure'],
      routes: [
        {
          match: 'Host(`nginx.homelab.mrida.ng`)',
          kind: 'Rule',
          middlewares: [
            {
              name: 'compression-middleware',
            },
          ],
          services: [
            {
              name: 'nginx',
              port: 80,
            },
          ],
        },
      ],
      tls: {
        certResolver: 'letsencrypt',
      },
    },
  },
  { provider, dependsOn: [traefik] },
);
