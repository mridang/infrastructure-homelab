import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import provider from './provider';
import { cloudflareEmail, cloudflareSecret } from './cloudflare';

const certManagerHelmRelease = new helm.Release('cert-manager', {
  chart: 'cert-manager',
  version: '1.16.3',
  repositoryOpts: {
    repo: 'https://charts.jetstack.io',
  },
  values: {
    installCRDs: true,
    extraArgs: [
      '--enable-certificate-owner-ref=true',
      '--dns01-recursive-nameservers-only',
      '--dns01-recursive-nameservers=8.8.8.8:53,1.1.1.1:53', // Specify the DNS resolvers
    ],
  },
});

const certificateIssuer = new k8s.apiextensions.CustomResource(
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

/**
 * Sometimes, there may be webhook connection problems shortly after cert-manager
 * installation. When you first install cert-manager, it will take a few seconds
 * before the cert-manager API is usable. This is because the cert-manager API
 * requires the cert-manager webhook server, which takes some time to start up.
 *
 * If everything is configured correctly, you should be able to see the issued
 * cert with this command
 *
 * ```
 * kubectl get secret test-certificate-secret -o=jsonpath='{.data.tls\.crt}' | base64 --decode | openssl x509 -noout -text
 * ```
 */
new k8s.apiextensions.CustomResource(
  'dummy-certificate',
  {
    apiVersion: 'cert-manager.io/v1',
    kind: 'Certificate',
    metadata: {
      name: 'test-certificate',
    },
    spec: {
      secretName: 'test-certificate-secret',
      issuerRef: {
        name: 'letsencrypt-cloudflare',
        kind: 'ClusterIssuer',
      },
      dnsNames: ['test.homelab.mrida.ng'],
    },
  },
  { provider, dependsOn: [certificateIssuer] },
);
