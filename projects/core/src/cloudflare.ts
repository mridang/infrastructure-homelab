/**
 * @file Creates the Kubernetes secret that holds the Cloudflare API credentials.
 */
import { Config } from '@pulumi/pulumi';
import { core } from '@pulumi/kubernetes';

const config = new Config();
const settings = config.requireObject('cloudflare') as {
  userEmail: string;
  apiToken: string;
};

export const cloudflareEmail = process.env[settings.userEmail] + '';
export const cloudflareSecret = new core.v1.Secret('cloudflare-api-token', {
  metadata: {
    name: 'cloudflare-api-token',
  },
  stringData: {
    CF_API_EMAIL: process.env[settings.userEmail] + '',
    CF_DNS_API_TOKEN: process.env[settings.apiToken] + '',
  },
});
