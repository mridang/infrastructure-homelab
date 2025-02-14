import * as k8s from '@pulumi/kubernetes';
import { interpolate } from '@pulumi/pulumi';
import provider from '../provider';
import { tailscale } from '../tailscale';
import { settings } from '../settings';

new k8s.core.v1.Secret('argocd-webhook-secret', {
  metadata: {
    name: 'argocd-webhook-secret',
  },
  stringData: {
    'webhook.github.secret': "shhhh! it's a GitHub secret",
  },
});

const argoCD = new k8s.helm.v3.Release('argocd-operator', {
  name: 'argocd-operator',
  chart: 'argo-cd',
  version: '7.7.18',
  repositoryOpts: {
    repo: 'https://argoproj.github.io/argo-helm',
  },
  values: {
    global: {
      revisionHistoryLimit: 1,
      addPrometheusAnnotations: true,
    },
    configs: {
      params: {
        'server.insecure': true,
      },
    },
    installCRDs: true,
    controller: {
      enabled: true,
    },
    webhook: {
      enabled: true,
      secretName: 'argocd-webhook-secret',
    },
  },
});

new k8s.networking.v1.Ingress(
  'tailscale-argocd-ingress',
  {
    metadata: {
      name: 'tailscale-argocd-ingress',
      annotations: {
        // Must be declared in the tailnet policy
        'tailscale.com/tags': [`tag:env-${settings.environmentName}`].join(','),
      },
    },
    spec: {
      ingressClassName: 'tailscale',
      defaultBackend: {
        service: {
          name: interpolate`${argoCD.name}-server`,
          port: {
            number: 80,
          },
        },
      },
      tls: [
        {
          hosts: ['argocd'],
        },
      ],
    },
  },
  {
    provider,
    dependsOn: [tailscale, argoCD],
  },
);
