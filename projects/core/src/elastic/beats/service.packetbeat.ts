import * as k8s from '@pulumi/kubernetes';
import { elasticsearchCluster } from '../service.elk';
import provider from '../../provider';
import { ELASTIC_VERSION } from '../constants';

const packetbeatServiceAccount = new k8s.core.v1.ServiceAccount('packetbeat', {
  metadata: { name: 'packetbeat', namespace: 'default' },
});

const packetbeatClusterRole = new k8s.rbac.v1.ClusterRole('packetbeat', {
  metadata: { name: 'packetbeat' },
  rules: [
    //
  ],
});

new k8s.rbac.v1.ClusterRoleBinding('packetbeat', {
  metadata: { name: 'packetbeat' },
  subjects: [
    {
      kind: 'ServiceAccount',
      name: packetbeatServiceAccount.metadata.name,
      namespace: 'default',
    },
  ],
  roleRef: {
    kind: 'ClusterRole',
    name: packetbeatClusterRole.metadata.name,
    apiGroup: 'rbac.authorization.k8s.io',
  },
});

new k8s.apiextensions.CustomResource(
  'packetbeat',
  {
    apiVersion: 'beat.k8s.elastic.co/v1beta1',
    kind: 'Beat',
    metadata: {
      name: 'packetbeat',
    },
    spec: {
      type: 'packetbeat',
      version: ELASTIC_VERSION,
      elasticsearchRef: {
        name: elasticsearchCluster.metadata.name,
      },
      config: {
        packetbeat: {
          interfaces: {
            device: 'any',
          },
          protocols: [
            {
              type: 'dns',
              ports: [53],
              include_authorities: true,
              include_additionals: true,
            },
            {
              type: 'http',
              ports: [80, 8000, 8080, 9200],
            },
          ],
          flows: {
            timeout: '30s',
            period: '10s',
          },
        },
        processors: [
          {
            add_host_metadata: {},
          },
        ],
      },
      daemonSet: {
        podTemplate: {
          spec: {
            terminationGracePeriodSeconds: 30,
            hostNetwork: true,
            automountServiceAccountToken: true, // some older Beat versions are depending on this settings presence in k8s context
            dnsPolicy: 'ClusterFirstWithHostNet',
            containers: [
              {
                name: 'packetbeat',
                securityContext: {
                  runAsUser: 0,
                  capabilities: {
                    add: ['NET_ADMIN'],
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
  {
    provider,
  },
);
