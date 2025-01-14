import * as k8s from '@pulumi/kubernetes';

export default new k8s.Provider('k8s-provider', {
  kubeconfig: process.env.KUBECONFIG,
  enableServerSideApply: true,
});
