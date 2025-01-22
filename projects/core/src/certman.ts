import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import provider from './provider';
import { cloudflareEmail, cloudflareSecret } from './cloudflare';

const certManagerHelmRelease = new helm.Release('cert-manager', {
  chart: 'cert-manager',
  version: 'v1.10.0', // Latest available version at the time of writing
  repositoryOpts: {
    repo: 'https://charts.jetstack.io',
  },
  values: {
    installCRDs: true, // Ensure CRDs are installed
  },
});

new k8s.apiextensions.CustomResource(
  'letsencrypt-issuer',
  {
    apiVersion: 'cert-manager.io/v1',
    kind: 'ClusterIssuer',
    metadata: {
      name: 'letsencrypt-cloudflare',
    },
    spec: {
      acme: {
        email: cloudflareEmail,
        server: 'https://acme-v02.api.letsencrypt.org/directory',
        privateKeySecretRef: {
          name: 'letsencrypt',
        },
        solvers: [
          {
            dns01: {
              cloudflare: {
                apiTokenSecretRef: {
                  name: cloudflareSecret.metadata.name,
                  key: 'CF_DNS_API_TOKEN',
                },
              },
            },
          },
        ],
      },
    },
  },
  { provider, dependsOn: [certManagerHelmRelease] },
);
