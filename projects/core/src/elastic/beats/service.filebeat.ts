import * as k8s from '@pulumi/kubernetes';
import { elasticsearch } from '../elastic';
import provider from '../../provider';
import { ELASTIC_VERSION } from '../constants';
import { kibana } from '../kibana';
import { scriptProcessors } from './processors';

const filebeatServiceAccount = new k8s.core.v1.ServiceAccount('filebeat', {
  metadata: { name: 'filebeat' },
});

const filebeatClusterRole = new k8s.rbac.v1.ClusterRole('filebeat', {
  metadata: { name: 'filebeat' },
  rules: [
    {
      apiGroups: [''],
      resources: ['namespaces', 'pods', 'nodes'],
      verbs: ['get', 'watch', 'list'],
    },
    {
      apiGroups: ['apps'],
      resources: ['replicasets'],
      verbs: ['get', 'list', 'watch'],
    },
    {
      apiGroups: ['batch'],
      resources: ['jobs'],
      verbs: ['get', 'list', 'watch'],
    },
  ],
});

new k8s.rbac.v1.ClusterRoleBinding('filebeat', {
  metadata: { name: 'filebeat' },
  subjects: [
    {
      kind: 'ServiceAccount',
      name: filebeatServiceAccount.metadata.name,
      namespace: 'default',
    },
  ],
  roleRef: {
    kind: 'ClusterRole',
    name: filebeatClusterRole.metadata.name,
    apiGroup: 'rbac.authorization.k8s.io',
  },
});

new k8s.apiextensions.CustomResource(
  'filebeat',
  {
    apiVersion: 'beat.k8s.elastic.co/v1beta1',
    kind: 'Beat',
    metadata: {
      name: 'filebeat',
      annotations: {
        'pulumi.com/patchForce': 'true',
      },
    },
    spec: {
      type: 'filebeat',
      version: ELASTIC_VERSION,
      elasticsearchRef: {
        name: elasticsearch.metadata.name,
      },
      kibanaRef: {
        name: kibana.metadata.name,
      },
      config: {
        filebeat: {
          autodiscover: {
            providers: [
              {
                type: 'kubernetes',
                node: '${NODE_NAME}',
                hints: {
                  enabled: true,
                  default_config: {
                    type: 'container',
                    paths: [
                      '/var/log/containers/*${data.kubernetes.container.id}.log',
                    ],
                  },
                },
              },
            ],
          },
        },
        processors: [
          {
            add_host_metadata: {},
          },
          {
            add_kubernetes_metadata: {},
          },
          {
            decode_json_fields: {
              fields: ['message'],
              target: '',
              overwrite_keys: true,
            },
          },
          ...scriptProcessors,
        ],
      },
      daemonSet: {
        podTemplate: {
          spec: {
            serviceAccountName: 'filebeat',
            automountServiceAccountToken: true,
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirstWithHostNet',
            hostNetwork: true,
            containers: [
              {
                name: 'filebeat',
                securityContext: {
                  runAsUser: 0,
                },
                volumeMounts: [
                  {
                    name: 'varlogcontainers',
                    mountPath: '/var/log/containers',
                  },
                  { name: 'varlogpods', mountPath: '/var/log/pods' },
                  {
                    name: 'varlibdockercontainers',
                    mountPath: '/var/lib/docker/containers',
                  },
                ],
                env: [
                  {
                    name: 'NODE_NAME',
                    valueFrom: {
                      fieldRef: {
                        fieldPath: 'spec.nodeName',
                      },
                    },
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'varlogcontainers',
                hostPath: { path: '/var/log/containers' },
              },
              { name: 'varlogpods', hostPath: { path: '/var/log/pods' } },
              {
                name: 'varlibdockercontainers',
                hostPath: { path: '/var/lib/docker/containers' },
              },
            ],
          },
        },
      },
    },
  },
  {
    provider,
    dependsOn: [elasticsearch, kibana],
  },
);
