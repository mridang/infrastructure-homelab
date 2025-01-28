import * as pulumi from '@pulumi/pulumi';

import './dns';
import './certman';
import './tailscale';
import './headlamp';
import './argocd';
import path from 'path';
import * as fs from 'node:fs';

export * from './elastic';
export * from './docker';

const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

pulumi.runtime.registerResourceTransform(
  (args: pulumi.ResourceTransformArgs) => {
    if (args.props.metadata) {
      args.props.metadata.labels = args.props.metadata.labels || {};
      args.props.metadata.labels['custom.mrida.ng/project'] = packageJson.name;
    } else {
      args.props.metadata = {
        labels: { 'custom.mrida.ng/project': packageJson.name },
      };
    }

    return {
      props: args.props,
      opts: args.opts,
    };
  },
);
