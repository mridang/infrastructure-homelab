import * as k8s from '@pulumi/kubernetes';
import provider from './provider';
import { tailscale } from './tailscale';
import { settings } from './settings';

const headlamp = new k8s.helm.v3.Chart('headlamp', {
  chart: 'headlamp',
  version: '0.28.0',
  fetchOpts: {
    repo: 'https://headlamp-k8s.github.io/headlamp/',
  },
  values: {
    //
  },
});

new k8s.networking.v1.Ingress(
  'tailscale-headlamp-ingress',
  {
    metadata: {
      name: 'tailscale-headlamp-ingress',
      annotations: {
        'tailscale.com/tags': [`environment:${settings.environmentName}`].join(
          ',',
        ),
      },
    },
    spec: {
      ingressClassName: 'tailscale',
      defaultBackend: {
        service: {
          name: 'headlamp',
          port: {
            number: 80,
          },
        },
      },
      tls: [
        {
          hosts: ['headlamp'],
        },
      ],
    },
  },
  {
    provider,
    dependsOn: [tailscale, headlamp],
  },
);
