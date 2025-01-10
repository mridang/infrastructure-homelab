import path from 'node:path';
import * as k8s from '@pulumi/kubernetes';
import fs from 'node:fs';
import provider from './provider';

const certPath = path.resolve(
  __dirname,
  '../../../etc/archive/internal.mrida.ng/fullchain1.pem',
);
const keyPath = path.resolve(
  __dirname,
  '../../../etc/archive/internal.mrida.ng/privkey1.pem',
);

 const tlsSecret = new k8s.core.v1.Secret(
  'internal-mrida-tls',
  {
    metadata: {
      name: 'internal-mrida-tls',
      namespace: 'default',
    },
    type: 'kubernetes.io/tls',
    data: {
      'tls.crt': Buffer.from(fs.readFileSync(certPath)).toString('base64'),
      'tls.key': Buffer.from(fs.readFileSync(keyPath)).toString('base64'),
    },
  },
  { provider },
);

export const tlsSecretName = tlsSecret.metadata.name;
