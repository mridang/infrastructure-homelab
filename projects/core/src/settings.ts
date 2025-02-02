import { Config } from '@pulumi/pulumi';

export const settings = new Config().requireObject('cluster') as {
  environmentName: string;
  clusterName: string;
  clusterDomain: string;
};
