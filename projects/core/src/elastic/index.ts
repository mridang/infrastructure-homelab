/**
 * @file Deploys the Elastic operator and, when lazy operations are enabled, seeds Elasticsearch once it is healthy.
 */
import { helm } from '@pulumi/kubernetes';
import provider from '../provider';
import { elasticsearch } from './elastic';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import kubeexec from '../utils/kubeexec';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { log } from '@pulumi/pulumi';
import { ELASTIC_VERSION } from './constants';
import { settings } from '../settings';

const execAsync = promisify(exec);

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

    await log.debug('Waiting for Elasticsearch cluster to become healthy...');

    /**
     * Checks the cluster once and, when it is healthy, seeds it.
     * @returns Whether the cluster was healthy and the seeding step ran.
     * @example
     * const seeded = await attempt();
     */
    async function attempt(): Promise<boolean> {
      try {
        const { stdout: result } = await execAsync(
          `kubectl get elasticsearch ${name} -n ${namespace} -o json`,
        );
        const jsonResult = JSON.parse(result);
        const health = jsonResult?.status?.health || '';

        await log.debug(`Cluster health status: ${health}`);

        if (health) {
          await log.info('Elasticsearch cluster is healthy!');
          await kubeexec(
            'esidx',
            // eslint-disable-next-line unicorn/prefer-module -- this package is CommonJS, where __dirname is defined
            path.join(__dirname, 'scripts', 'index.ts'),
            namespace,
            'node:22-slim',
            [
              { name: 'ELASTICSEARCH_VERSION', value: ELASTIC_VERSION },
              { name: 'ELASTICSEARCH_HOSTNAME', value: `${name}-es-http` },
              { name: 'ELASTICSEARCH_USERNAME', value: 'elastic' },
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
          return true;
        }
      } catch (error) {
        console.warn(`Error checking cluster status: ${error}`);
      }
      return false;
    }

    for (let i = 0; i < 10; i++) {
      if (await attempt()) {
        return;
      }

      await setTimeout(10_000);
    }

    throw new Error(
      'Elasticsearch cluster did not reach green status within the expected time.',
    );
  });
}
