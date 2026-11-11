/**
 * @file Installs the Headlamp dashboard and exposes it through a Tailscale ingress.
 */
import { helm, networking } from '@pulumi/kubernetes';
import provider from './provider';
import { tailscale } from './tailscale';
import { settings } from './settings';

const headlamp = new helm.v3.Chart('headlamp', {
  chart: 'headlamp',
  version: '0.28.0',
  fetchOpts: {
    repo: 'https://headlamp-k8s.github.io/headlamp/',
  },
  values: {
    //
  },
});

new networking.v1.Ingress(
  'tailscale-headlamp-ingress',
  {
    metadata: {
      name: 'tailscale-headlamp-ingress',
      annotations: {
        // Must be declared in the tailnet policy
        'tailscale.com/tags': [`tag:env-${settings.environmentName}`].join(','),
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
