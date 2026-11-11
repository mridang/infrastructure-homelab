/**
 * @file Creates the Kubernetes provider that every resource in the program shares.
 */
import { Provider } from '@pulumi/kubernetes';
import { settings } from './settings';

export default new Provider('k8s-provider', {
  kubeconfig: process.env.KUBECONFIG,
  context: settings.clusterName,
  enableServerSideApply: true,
});
