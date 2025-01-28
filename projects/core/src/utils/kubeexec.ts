import { execSync } from 'child_process';

/**
 * Utility function to run Typescript scripts inside the cluster using an
 * ephemeral Node.Js pod.
 *
 * @param podName The name of the pod to use - any name will do
 * @param scriptPath The absolute path to the script to run
 * @param namespace The name to run the pod in - defaults to "default"
 * @param envArgs Any additional arguments for the pod
 */
export default function (
  podName: string,
  scriptPath: string,
  namespace: string = 'default',
  envArgs: { name: string; value?: string; valueFrom?: any }[],
) {
  try {
    console.log(`Creating a Node.js 22 container pod: ${podName}...`);
    execSync(
      `kubectl run ${podName} --image=node:22 --restart=Never --command --namespace=${namespace} --overrides='${JSON.stringify(
        {
          spec: {
            containers: [
              {
                name: 'nodejs-container',
                image: 'node:22',
                env: envArgs,
                command: ['sh', '-c', 'sleep infinity'],
              },
            ],
            restartPolicy: 'Never',
          },
        },
      )}'`,
      { stdio: 'inherit' },
    );

    console.log('Waiting for the pod to be ready...');
    execSync(
      `kubectl wait pod/${podName} --for=condition=Ready --timeout=60s --namespace=${namespace}`,
      { stdio: 'inherit' },
    );

    console.log(`Copying the script to pod ${podName}...`);
    execSync(
      `kubectl cp ${scriptPath} ${namespace}/${podName}:/tmp/script.ts`,
      { stdio: 'inherit' },
    );

    console.log(`Executing the script in pod ${podName}...`);
    execSync(
      `kubectl exec ${podName} --namespace=${namespace} -- node --no-warnings --experimental-strip-types /tmp/script.ts`,
      { stdio: 'inherit' },
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
    execSync(
      `kubectl delete pod ${podName} --namespace=${namespace} --ignore-not-found`,
      { stdio: 'inherit' },
    );
    console.log('Cleanup completed!');
  }
}
