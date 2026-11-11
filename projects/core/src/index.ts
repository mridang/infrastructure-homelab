/**
 * @file Entry point of the core Pulumi program that loads every component and labels its resources.
 */

import './traefik';
import './dns';
import './certman';
import './tailscale';
import './argocd';
import './headlamp';
import { settings } from './settings';
import {
  getOrganization,
  getProject,
  getStack,
  ResourceTransformArgs,
  runtime,
} from '@pulumi/pulumi';

export { apmServerUrl, elasticsearch, kibana } from './elastic';
export { gcrCredentials } from './docker';

runtime.registerResourceTransform((args: ResourceTransformArgs) => {
  args.props.metadata = {
    labels: {
      'custom.mrida.ng/organization': getOrganization(),
      'custom.mrida.ng/project': getProject(),
      'custom.mrida.ng/stack': getStack(),
      'custom.mrida.ng/environment': settings.environmentName,
      ...args.props.metadata?.labels,
    },
    ...args.props.metadata,
  };

  return {
    props: args.props,
    opts: args.opts,
  };
});
