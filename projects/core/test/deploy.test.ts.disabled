import { execSync } from 'child_process';
import { LocalWorkspace, Stack } from '@pulumi/pulumi/automation';
import {
  LocalProgramArgs,
  LocalWorkspaceOptions,
} from '@pulumi/pulumi/automation/localWorkspace';

describe('Pulumi Stack Deployment', () => {
  let stack: Stack | undefined;

  beforeAll(async () => {
    stack = await LocalWorkspace.createOrSelectStack(
      {
        stackName: 'test',
        workDir: process.cwd(),
      } satisfies LocalProgramArgs,
      {
        workDir: process.cwd(),
        envVars: {
          //
        },
      } satisfies LocalWorkspaceOptions,
    );

    const refreshResult = await stack.refresh({
      onOutput: console.info,
      color: 'never',
    });
    console.log('Pulumi stack deployed:', refreshResult.summary);
    try {
      const upResult = await stack.up({
        onOutput: console.info,
        color: 'never',
        suppressProgress: true,
      });
      console.log('Pulumi stack deployed:', upResult.summary);
    } catch (firstError) {
      console.warn(
        'First attempt to update the stack failed. Retrying...',
        firstError,
      );
      try {
        const upResult = await stack.up({
          onOutput: console.info,
          color: 'never',
          suppressProgress: true,
        });
        console.log('Pulumi stack deployed:', upResult.summary);
      } catch (secondError) {
        console.error(
          'Second attempt to update the stack failed.',
          secondError,
        );
        throw secondError;
      }
    }
  }, 300000);

  afterAll(async () => {
    if (stack !== undefined) {
      const abortController = new AbortController();
      const abortTimer = setTimeout(() => {
        console.warn('Destroy operation taking too long; aborting...');
        abortController.abort();
      }, 290000);
      try {
        const destroyResult = await stack.destroy({
          onOutput: console.info,
          color: 'never',
          suppressProgress: true,
          continueOnError: true,
          signal: abortController.signal, // Pass the abort signal here
        });
        console.log('Pulumi stack torn down:', destroyResult.summary);
      } catch (e) {
        console.error('Destroy failed or was aborted:', e);
      } finally {
        clearTimeout(abortTimer);
      }
    }
  }, 300000);

  it('should create the Kubernetes namespace', () => {
    const nsOutput = execSync('kubectl get ns default --no-headers').toString();
    expect(nsOutput).toContain('default');
  });
});
