/**
 * @file Deploys the Elastic operator and, when lazy operations are enabled, seeds Elasticsearch once it is healthy.
 */
import { helm } from '@pulumi/kubernetes';
import provider from '../provider';
import { elasticsearch } from './elastic';
import { execSync } from 'node:child_process';
import kubeexec from '../utils/kubeexec';
import path from 'node:path';
import { log } from '@pulumi/pulumi';
import { ELASTIC_VERSION } from './constants';
import { settings } from '../settings';

new helm.v3.Release(
  'eck-operator',
  {
    name: 'operator-elk',
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

export { elasticsearch } from './elastic';
export { kibana } from './kibana';
export { apmServerUrl } from './apm';
import './beats/service.filebeat';
import './beats/service.metricbeat';
import './beats/service.packetbeat';

if (settings.lazyOps) {
  elasticsearch.metadata.apply(async (metadata) => {
    const { name, namespace } = metadata;

    // eslint-disable-next-line testing-library/no-debugging-utils -- progress is logged while the cluster comes up
    await log.debug('Waiting for Elasticsearch cluster to become healthy...');

    let health = '';
    for (let i = 0; i < 10; i++) {
      try {
        // eslint-disable-next-line n/no-sync -- sync is fine in a script/bootstrap, polling runs once while Pulumi applies
        const result = execSync(
          `kubectl get elasticsearch ${name} -n ${namespace} -o json`,
          { encoding: 'utf8' },
        );
        const jsonResult = JSON.parse(result);
        health = jsonResult?.status?.health || '';

        // eslint-disable-next-line testing-library/no-debugging-utils -- progress is logged while the cluster comes up
        await log.debug(`Cluster health status: ${health}`);

        // eslint-disable-next-line sonarjs/nested-control-flow -- the retry loop reads most clearly as one block
        if (health) {
          await log.info('Elasticsearch cluster is healthy!');
          kubeexec(
            'esidx',
            // eslint-disable-next-line unicorn/prefer-module -- this package is CommonJS, where __dirname is defined
            path.join(__dirname, 'scripts', 'index.ts'),
            namespace,
            'node:22-slim',
            [
              {
                name: 'ELASTICSEARCH_VERSION',
                value: ELASTIC_VERSION,
              },
              {
                name: 'ELASTICSEARCH_HOSTNAME',
                value: `${name}-es-http`,
              },
              {
                name: 'ELASTICSEARCH_USERNAME',
                value: 'elastic',
              },
              {
                name: 'ELASTICSEARCH_PASSWORD',
                valueFrom: {
                  secretKeyRef: {
                    name: `${name}-es-elastic-user`,
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

      // eslint-disable-next-line n/no-sync, sonarjs/no-os-command-from-path -- sync is fine in a script/bootstrap, and sleep is a fixed system command
      execSync('sleep 10');
    }

    throw new Error(
      'Elasticsearch cluster did not reach green status within the expected time.',
    );
  });
}
