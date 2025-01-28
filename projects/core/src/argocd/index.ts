import * as k8s from '@pulumi/kubernetes';
import * as fs from 'node:fs';
import path from 'node:path';
import { interpolate } from '@pulumi/pulumi';
import provider from '../provider';

const githubSSHSecret = new k8s.core.v1.Secret('github-ssh-key', {
  metadata: {
    name: 'github-ssh-key',
  },
  stringData: {
    'ssh-privatekey': fs.readFileSync(
      path.join(__dirname, '..', '..', '..', '..', 'id_rsa_k8'),
      'utf8',
    ),
  },
});

const webhookSecret = new k8s.core.v1.Secret('argocd-webhook-secret', {
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
    repositoryCredentials: [
      {
        url: 'git@github.com:your/repo.git',
        secretName: 'github-ssh-key',
        knownHostsConfigMap: 'github-known-hosts',
      },
    ],
    webhook: {
      enabled: true,
      secretName: 'argocd-webhook-secret',
    },
  },
});

new k8s.apiextensions.CustomResource(
  'argocd-ingressroute',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'IngressRoute',
    metadata: {
      name: 'argocd-ingressroute',
      namespace: 'default',
    },
    spec: {
      entryPoints: ['websecure'],
      routes: [
        {
          match: 'Host(`argocd.homelab.mrida.ng`)',
          kind: 'Rule',
          services: [
            {
              name: interpolate`${argoCD.name}-server`,
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
  {
    provider,
    dependsOn: [argoCD],
  },
);

new k8s.networking.v1.Ingress(
  'tailscale-argocd-ingress',
  {
    metadata: {
      name: 'tailscale-argocd-ingress',
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
    dependsOn: argoCD,
  },
);
