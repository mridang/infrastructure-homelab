import * as k8s from '@pulumi/kubernetes';
import provider from '../provider';
import { Config } from '@pulumi/pulumi';
import { cloudflareSecret } from '../cloudflare';

export const traefik = new k8s.helm.v3.Chart(
  'traefik',
  {
    chart: 'traefik',
    version: '33.2.1',
    fetchOpts: {
      repo: 'https://helm.traefik.io/traefik',
    },
    values: {
      image: {
        tag: '3.3.1',
      },
      deployment: {
        additionalVolumes: [
          {
            name: 'traefik-logs',
            emptyDir: {}, // This ensures the logs are stored in an ephemeral directory
          },
        ],
      },
      additionalVolumeMounts: [
        {
          name: 'traefik-logs',
          mountPath: '/var/log/traefik',
          readOnly: false,
        },
      ],
      logs: {
        general: {
          level: 'INFO',
        },
        access: {
          enabled: true,
          filePath: '/var/log/traefik/access.log',
        },
      },
      ports: {
        traefik: {
          expose: {
            default: true,
          },
          exposedPort: 8080,
          nodePort: 32000,
          protocol: 'TCP',
        },
        websecure: {
          http3: {
            enabled: true,
          },
        },
      },
      ingressRoute: {
        dashboard: {
          enabled: true,
          tls: {
            certResolver: 'letsencrypt',
          },
          entryPoints: ['websecure', 'traefik'],
          middlwares: [
            {
              name: 'compression-middleware',
            },
          ],
          matchRule: 'Host(`traefik.homelab.mrida.ng`)',
        },
        healthcheck: {
          enabled: true,
        },
        metrics: {
          prometheus: {
            enabled: true,
            port: 9100,
            entryPoint: 'metrics',
            addEntryPointsLabels: true,
            addRoutersLabels: true,
            addServicesLabels: true,
          },
        },
      },
      certificatesResolvers: {
        letsencrypt: {
          acme: {
            storage: '/tmp/acme.json',
            dnsChallenge: {
              provider: 'cloudflare',
              resolvers: ['1.1.1.1', '1.0.0.1'],
              delayBeforeCheck: 60,
            },
          },
        },
      },
      envFrom: [
        {
          secretRef: {
            name: cloudflareSecret.metadata.name,
          },
        },
      ],
    },
  },
  { provider },
);

new k8s.apiextensions.CustomResource(
  'compression-middleware',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'Middleware',
    metadata: {
      name: 'compression--middleware',
      namespace: 'default',
    },
    spec: {
      compress: {
        //
      },
    },
  },
  { provider },
);
