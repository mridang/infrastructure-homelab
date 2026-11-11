/**
 * @file Runs a TypeScript script inside a short-lived Kubernetes pod and removes the pod afterwards.
 */

import { spawn } from 'node:child_process';
import { once } from 'node:events';

/**
 * Runs a shell command with inherited stdio and rejects when it exits unsuccessfully.
 * @param command - The shell command line to run.
 * @example
 * await execInherit('kubectl get pods');
 */
async function execInherit(command: string): Promise<void> {
  const child = spawn(command, { shell: true, stdio: 'inherit' });
  const [code] = (await once(child, 'close')) as [number | null];
  if (code !== 0) {
    throw new Error(`Command failed with exit code ${code}: ${command}`);
  }
}

/**
 * Utility function to run Typescript scripts inside the cluster using an
 * ephemeral Node.Js pod.
 * @param podName - The name of the pod to use - any name will do.
 * @param scriptPath - The absolute path to the script to run.
 * @param namespace - The name to run the pod in - defaults to "default".
 * @param imageName - The container image that runs the script, defaulting to node:22-slim.
 * @param envArgs - Any additional arguments for the pod.
 * @example
 * kubeexec('esidx', '/abs/path/to/scripts/index.ts', 'default', 'node:22-slim', [
 *   { name: 'ELASTICSEARCH_HOSTNAME', value: 'my-cluster-es-http' },
 * ]);
 */
export default async function kubeexec(
  podName: string,
  scriptPath: string,
  namespace: string = 'default',
  imageName: string = 'node:22-slim',
  envArgs: { name: string; value?: string; valueFrom?: unknown }[],
): Promise<void> {
  try {
    console.log(`Creating a ${imageName} container pod: ${podName}...`);
    await execInherit(
      `kubectl run ${podName} --image=${imageName} --restart=Never --command --namespace=${namespace} --overrides='${JSON.stringify(
        {
          spec: {
            containers: [
              {
                name: podName,
                image: imageName,
                env: envArgs,
                command: ['sh', '-c', 'sleep infinity'],
              },
            ],
            restartPolicy: 'Never',
          },
        },
      )}'`,
    );

    console.log('Waiting for the pod to be ready...');
    await execInherit(
      `kubectl wait pod/${podName} --for=condition=Ready --timeout=60s --namespace=${namespace}`,
    );

    console.log(`Copying the script to pod ${podName}...`);
    await execInherit(
      `kubectl cp ${scriptPath} ${namespace}/${podName}:/tmp/script.ts`,
    );

    console.log(`Executing the script in pod ${podName}...`);
    await execInherit(
      `kubectl exec ${podName} --namespace=${namespace} -- node --no-warnings --experimental-strip-types /tmp/script.ts`,
    );

    console.log('Script executed successfully!');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    } else {
      console.error('Unknown error:', error);
    }
  } finally {
    console.log(`Cleaning up: Deleting pod ${podName}`);
    await execInherit(
      `kubectl delete pod ${podName} --namespace=${namespace} --ignore-not-found`,
    );
    console.log('Cleanup completed!');
  }
}
