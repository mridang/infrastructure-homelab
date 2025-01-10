import * as k8s from '@pulumi/kubernetes';
import provider from '../provider';
import { Config } from '@pulumi/pulumi';

const config = new Config();
const settings = config.requireObject('tailscale') as {
  clientId: string;
  clientSecret: string;
};

const eckOperatorNamespace = new k8s.core.v1.Namespace('tailscale', {
  metadata: {
    name: 'tailscale',
  },
});

new k8s.helm.v3.Release(
  'tailscale-operator',
  {
    namespace: eckOperatorNamespace.metadata.name,
    chart: 'tailscale-operator',
    version: '1.78.3',
    repositoryOpts: {
      repo: 'https://pkgs.tailscale.com/helmcharts',
    },
    values: {
      oauth: {
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
      },
    },
  },
  {
    provider,
  },
);
