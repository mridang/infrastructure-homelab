import * as k8s from '@pulumi/kubernetes';
import provider from '../provider';
import { elasticsearch } from './elastic';
import { execSync } from 'node:child_process';
import kubeexec from '../utils/kubeexec';
import path from 'path';
import { log } from '@pulumi/pulumi';
import { ELASTIC_VERSION } from './constants';

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

elasticsearch.metadata.apply((metadata) => {
  const name = metadata.name;
  const namespace = metadata.namespace;

  log.debug('Waiting for Elasticsearch cluster to become healthy...');

  let health = '';
  for (let i = 0; i < 10; i++) {
    try {
      const result = execSync(
        `kubectl get elasticsearch ${name} -n ${namespace} -o json`,
        { encoding: 'utf-8' },
      );
      const jsonResult = JSON.parse(result);
      health = jsonResult?.status?.health || '';

      log.debug(`Cluster health status: ${health}`);

      if (health) {
        log.info('Elasticsearch cluster is healthy!');
        kubeexec(
          'esidx',
          path.join(__dirname, 'scripts', 'index.ts'),
          metadata.namespace,
          'node:22-slim',
          [
            {
              name: 'ELASTICSEARCH_VERSION',
              value: ELASTIC_VERSION,
            },
            {
              name: 'ELASTICSEARCH_HOSTNAME',
              value: `${metadata.name}-es-http`,
            },
            {
              name: 'ELASTICSEARCH_USERNAME',
              value: 'elastic',
            },
            {
              name: 'ELASTICSEARCH_PASSWORD',
              valueFrom: {
                secretKeyRef: {
                  name: `${metadata.name}-es-elastic-user`,
                  key: 'elastic',
                },
              },
            },
          ],
        );
        return;
      }
    } catch (error) {
      console.warn(`Error checking cluster status: ${error}`);
    }

    execSync('sleep 10');
  }

  throw new Error(
    'Elasticsearch cluster did not reach green status within the expected time.',
  );
});
