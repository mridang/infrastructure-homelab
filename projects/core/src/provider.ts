import * as k8s from '@pulumi/kubernetes';
import { settings } from './settings';

export default new k8s.Provider('k8s-provider', {
  kubeconfig: process.env.KUBECONFIG,
  context: settings.clusterName,
  enableServerSideApply: true,
});
