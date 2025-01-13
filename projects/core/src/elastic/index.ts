import * as k8s from '@pulumi/kubernetes';
import provider from '../provider';

const eckOperatorNamespace = new k8s.core.v1.Namespace('elastic', {
  metadata: {
    name: 'elastic',
  },
});

new k8s.helm.v3.Release(
  'eck-operator',
  {
    name: 'operator-elk',
    namespace: eckOperatorNamespace.metadata.name,
    chart: 'eck-operator',
    version: '2.16.0',
    repositoryOpts: {
      repo: 'https://helm.elastic.co',
    },
  },
  {
    provider,
  },
);

export * from './elastic';
export * from './kibana';
export * from './apm';
export * from './beats/service.filebeat';
export * from './beats/service.metricbeat';
export * from './beats/service.packetbeat';
