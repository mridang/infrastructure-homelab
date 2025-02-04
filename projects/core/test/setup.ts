/* eslint-disable no-console */
import { execSync } from 'child_process';
import { config } from 'dotenv';
import * as fs from 'node:fs';
import path = require('node:path');
import * as os from 'node:os';

config();
process.env.PULUMI_BACKEND_URL = `file://${fs.mkdtempSync(path.join(os.tmpdir(), 'pulumi-'))}`;
process.env.PULUMI_CONFIG_PASSPHRASE = 'insecure';

// noinspection JSUnusedGlobalSymbols
export default async function setup(): Promise<void> {
  try {
    console.log('Creating KinD cluster...');
    execSync('kind create cluster --name=homelab-dev', {
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Error during global setup:', err);
    process.exit(1);
  }
}
