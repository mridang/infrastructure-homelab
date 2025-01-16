import * as k8s from '@pulumi/kubernetes';
import provider from '../provider';
import { Config } from '@pulumi/pulumi';

const config = new Config();
const settings = config.requireObject('cloudflare') as {
  userEmail: string;
  apiToken: string;
};

new k8s.helm.v3.Release(
  'external-dns',
  {
    name: 'external-dns',
    chart: 'external-dns',
    version: '1.15.0',
    //namespace: 'kube-system',
    repositoryOpts: {
      repo: 'https://kubernetes-sigs.github.io/external-dns/',
    },
    values: {
      logLevel: 'trace',
      env: [
        {
          name: 'CF_API_TOKEN',
          value: process.env[settings.apiToken],
        },
      ],
      provider: 'cloudflare',
      proxy: 'false',
      sources: ['traefik-proxy'],
      extraArgs: ['--traefik-disable-legacy'],
    },
  },
  {
    provider,
  },
);
