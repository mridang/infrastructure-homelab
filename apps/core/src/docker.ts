import * as k8s from '@pulumi/kubernetes';
import { Config } from '@pulumi/pulumi';

const config = new Config();
const settings = config.requireObject('github') as {
  registryUsername: string;
  registryPassword: string;
};

const dockerRegistrySecret = new k8s.core.v1.Secret(
  'docker-credentials-github',
  {
    metadata: {
      name: 'docker-credentials-github',
    },
    data: {
      '.dockerconfigjson': Buffer.from(
        JSON.stringify({
          auths: {
            'ghcr.io': {
              auth: Buffer.from(
                `${process.env[settings.registryUsername]}:${process.env[settings.registryPassword]}`,
              ).toString('base64'),
            },
          },
        }),
      ).toString('base64'),
    },
    type: 'kubernetes.io/dockerconfigjson',
  },
);

export const gcrCredentials = dockerRegistrySecret.metadata.name;
