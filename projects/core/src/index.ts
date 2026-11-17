/**
 * @file Entry point of the core Pulumi program that loads every component and labels its resources.
 */

import './traefik';
import './dns';
import './certman';
import './tailscale';
import './argocd';
import './headlamp';
import { getOrganization, getProject, getStack, runtime } from '@pulumi/pulumi';
import { settings } from './settings';
import type { ResourceTransformArgs } from '@pulumi/pulumi';

export { apmServerUrl, elasticsearch, kibana } from './elastic';
export { gcrCredentials } from './docker';

/** The resource properties this transform reads and labels, typed once here. */
interface ResourceProps {
  metadata?: { labels?: Record<string, string>; [key: string]: unknown };
  [key: string]: unknown;
}

runtime.registerResourceTransform((args: ResourceTransformArgs) => {
  const props = args.props as ResourceProps;
  // eslint-disable-next-line functional/immutable-data -- a Pulumi resource transform adjusts the incoming props in place
  props.metadata = {
    labels: {
      'custom.mrida.ng/organization': getOrganization(),
      'custom.mrida.ng/project': getProject(),
      'custom.mrida.ng/stack': getStack(),
      'custom.mrida.ng/environment': settings.environmentName,
      ...props.metadata?.labels,
    },
    ...props.metadata,
  };

  return {
    props,
    opts: args.opts,
  };
});
