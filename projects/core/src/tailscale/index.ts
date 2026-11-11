/**
 * @file Installs the Tailscale Kubernetes operator using OAuth credentials from the environment.
 */
import { helm } from '@pulumi/kubernetes';
import provider from '../provider';
import { Config, getStack } from '@pulumi/pulumi';

const config = new Config();
const settings = config.requireObject('tailscale') as {
  clientId: string;
  clientSecret: string;
};

export const tailscale = new helm.v3.Release(
  'tailscale-operator',
  {
    chart: 'tailscale-operator',
    version: '1.78.3',
    repositoryOpts: {
      repo: 'https://pkgs.tailscale.com/helmcharts',
    },
    values: {
      oauth: {
        clientId: process.env[settings.clientId],
        clientSecret: process.env[settings.clientSecret],
      },
      operatorConfig: {
        defaultTags: ['tag:k8s', `tag:${getStack()}`],
      },
    },
  },
  {
    provider,
  },
);
