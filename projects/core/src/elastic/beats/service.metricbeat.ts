import * as k8s from '@pulumi/kubernetes';
import { elasticsearch } from '../elastic';
import provider from '../../provider';
import { ELASTIC_VERSION } from '../constants';
import { kibana } from '../kibana';

const metricbeatServiceAccount = new k8s.core.v1.ServiceAccount('metricbeat', {
  metadata: { name: 'metricbeat', namespace: 'default' },
});

const metricbeatClusterRole = new k8s.rbac.v1.ClusterRole('metricbeat', {
  metadata: { name: 'metricbeat' },
  rules: [
    {
      apiGroups: [''],
      resources: ['nodes', 'namespaces', 'events', 'pods'],
      verbs: ['get', 'list', 'watch'],
    },
    {
      apiGroups: ['extensions'],
      resources: ['replicasets'],
      verbs: ['get', 'list', 'watch'],
    },
    {
      apiGroups: ['apps'],
      resources: ['statefulsets', 'deployments', 'replicasets'],
      verbs: ['get', 'list', 'watch'],
    },
    {
      apiGroups: [''],
      resources: ['nodes/stats'],
      verbs: ['get'],
    },
    {
      nonResourceURLs: ['/metrics'],
      verbs: ['get'],
    },
  ],
});

new k8s.rbac.v1.ClusterRoleBinding('metricbeat', {
  metadata: { name: 'metricbeat' },
  subjects: [
    {
      kind: 'ServiceAccount',
      name: metricbeatServiceAccount.metadata.name,
      namespace: 'default',
    },
  ],
  roleRef: {
    kind: 'ClusterRole',
    name: metricbeatClusterRole.metadata.name,
    apiGroup: 'rbac.authorization.k8s.io',
  },
});

/**
 * Metricbeat is configured to read metrics about services that are annotated
 * with the following annotation `prometheus.io/scrape: true`.
 *
 * The prometheus endpoint comes from `prometheus.io/scrape` and the
 * port from `prometheus.io/port`
 */
new k8s.apiextensions.CustomResource(
  'metricbeat',
  {
    apiVersion: 'beat.k8s.elastic.co/v1beta1',
    kind: 'Beat',
    metadata: {
      name: 'metricbeat',
      annotations: {
        'pulumi.com/patchForce': 'true',
      },
    },
    spec: {
      type: 'metricbeat',
      version: ELASTIC_VERSION,
      elasticsearchRef: {
        name: elasticsearch.metadata.name,
      },
      kibanaRef: {
        name: kibana.metadata.name,
      },
      config: {
        metricbeat: {
          autodiscover: {
            providers: [
              {
                type: 'kubernetes',
                node: '${NODE_NAME}',
                hints: {
                  enabled: true,
                  default_config: {},
                },
              },
              {
                type: 'kubernetes',
                host: '${HOSTNAME}',
                templates: [
                  {
                    'condition.equals': {
                      'kubernetes.annotations.prometheus.io/scrape': 'true',
                    },
                    config: [
                      {
                        module: 'prometheus',
                        period: '10s',
                        hosts: [
                          '${data.host}:${data.kubernetes.annotations.prometheus.io/port}',
                        ],
                        metrics_path:
                          '${data.kubernetes.annotations.prometheus.io/path:/metrics}',
                      },
                    ],
                  },
                ],
              },
            ],
          },
          modules: [
            {
              module: 'system',
              period: '10s',
              metricsets: [
                'cpu',
                'load',
                'memory',
                'network',
                'process',
                'process_summary',
              ],
              process: {
                include_top_n: {
                  by_cpu: 5,
                  by_memory: 5,
                },
              },
              processes: ['.*'],
            },
            {
              module: 'system',
              period: '1m',
              metricsets: ['filesystem', 'fsstat'],
              processors: [
                {
                  drop_event: {
                    when: {
                      regexp: {
                        system: {
                          filesystem: {
                            mount_point:
                              '^/(sys|cgroup|proc|dev|etc|host|lib)($|/)',
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
            {
              module: 'kubernetes',
              period: '10s',
              node: '${NODE_NAME}',
              hosts: ['https://${NODE_IP}:10250'],
              bearer_token_file:
                '/var/run/secrets/kubernetes.io/serviceaccount/token',
              ssl: {
                verification_mode: 'none',
              },
              metricsets: ['node', 'system', 'pod', 'container', 'volume'],
            },
          ],
        },
        processors: [
          {
            add_host_metadata: {},
          },
          {
            add_kubernetes_metadata: {},
          },
        ],
      },
      daemonSet: {
        podTemplate: {
          spec: {
            serviceAccountName: 'metricbeat',
            automountServiceAccountToken: true,
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirstWithHostNet',
            hostNetwork: true,
            containers: [
              {
                name: 'metricbeat',
                securityContext: {
                  runAsUser: 0,
                },
                volumeMounts: [
                  {
                    name: 'cgroup',
                    mountPath: '/hostfs/sys/fs/cgroup',
                  },
                  {
                    name: 'dockersock',
                    mountPath: '/var/run/docker.sock',
                  },
                  {
                    name: 'proc',
                    mountPath: '/hostfs/proc',
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
                  {
                    name: 'NODE_IP',
                    valueFrom: {
                      fieldRef: {
                        fieldPath: 'status.hostIP',
                      },
                    },
                  },
                ],
              },
            ],
            volumes: [
              {
                name: 'cgroup',
                hostPath: { path: '/sys/fs/cgroup' },
              },
              {
                name: 'dockersock',
                hostPath: { path: '/var/run/docker.sock' },
              },
              {
                name: 'proc',
                hostPath: { path: '/proc' },
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
