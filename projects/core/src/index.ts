import * as pulumi from '@pulumi/pulumi';

import './traefik';
import './dns';
import './certman';
import './tailscale';
import './argocd';
import './headlamp';
import { settings } from './settings';
import { getOrganization, getProject, getStack } from '@pulumi/pulumi';

export * from './elastic';
export * from './docker';

pulumi.runtime.registerResourceTransform(
  (args: pulumi.ResourceTransformArgs) => {
    args.props.metadata = {
      labels: {
        'custom.mrida.ng/organization': getOrganization(),
        'custom.mrida.ng/project': getProject(),
        'custom.mrida.ng/stack': getStack(),
        'custom.mrida.ng/environment': settings.environmentName,
        ...(args.props.metadata?.labels || {}),
      },
      ...(args.props.metadata || {}),
    };

    return {
      props: args.props,
      opts: args.opts,
    };
  },
);
