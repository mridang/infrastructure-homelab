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
    const upResult = await stack.up({
      onOutput: console.info,
      color: 'never',
    });
    console.log('Pulumi stack deployed:', upResult.summary);
  }, 300000);

  afterAll(async () => {
    if (stack !== undefined) {
      const destroyResult = await stack.destroy({
        onOutput: console.info,
        color: 'never',
      });
      console.log('Pulumi stack torn down:', destroyResult.summary);
    }
  }, 300000);

  it('should create the Kubernetes namespace', () => {
    const nsOutput = execSync('kubectl get ns test --no-headers').toString();
    expect(nsOutput).toContain('test');
  });
});
