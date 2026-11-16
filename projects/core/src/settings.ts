/**
 * @file Reads the cluster configuration from the Pulumi stack.
 */
import { Config } from '@pulumi/pulumi';

export const settings = new Config().requireObject<{
  environmentName: string;
  clusterName: string;
  clusterDomain: string;
  loadBalancer: boolean;
  lazyOps: boolean;
}>('cluster');
