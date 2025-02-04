/* eslint-disable no-console */
import { execSync } from 'child_process';

// noinspection JSUnusedGlobalSymbols
export default async function teardown(): Promise<void> {
  try {
    console.log('Deleting KinD cluster...');
    execSync('kind delete cluster --name=homelab-dev', { stdio: 'inherit' });
  } catch (err) {
    console.error('Error during global teardown:', err);
    process.exit(1);
  }
}
