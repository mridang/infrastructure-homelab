import { execSync } from 'node:child_process';

// noinspection JSUnusedGlobalSymbols
export default async function teardown(): Promise<void> {
  try {
    console.log('Deleting KinD cluster...');
    execSync('kind delete cluster --name=homelab-dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error during global teardown:', error);
    process.exit(1);
  }
}
