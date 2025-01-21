import * as k8s from '@pulumi/kubernetes';
import { elasticsearch } from '../elastic';
import provider from '../../provider';
import { ELASTIC_VERSION } from '../constants';
import path from 'path';
import * as fs from 'node:fs';

const filebeatServiceAccount = new k8s.core.v1.ServiceAccount('filebeat', {
  metadata: { name: 'filebeat', namespace: 'default' },
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
            decode_json_fields: {
              fields: ['message'],
              target: '',
              overwrite_keys: true,
            },
          },
          {
            script: {
              when: {
                regexp: {
                  message:
                    '[\\\\u001b\\\\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]',
                },
              },
              lang: 'javascript',
              id: 'remove_ansi_color',
              source: fs.readFileSync(
                path.join(__dirname, 'processors', 'strip_color.js'),
                'utf-8',
              ),
            },
          },
          {
            script: {
              when: {
                regexp: {
                  message:
                    '^(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z)\\s+(TRC|DBG|INF|WRN|ERR|FTL|PNC)\\s+(.*)',
                },
              },
              lang: 'javascript',
              id: 'parse_traefik',
              source: fs.readFileSync(
                path.join(__dirname, 'processors', 'parse_traefik.js'),
                'utf-8',
              ),
            },
          },
          {
            script: {
              when: {
                regexp: {
                  message:
                    '^(\\d{4}\\/\\d{2}\\/\\d{2} \\d{2}:\\d{2}:\\d{2})\\s+(.*)',
                },
              },
              lang: 'javascript',
              id: 'parse_tailscale',
              source: fs.readFileSync(
                path.join(__dirname, 'processors', 'parse_tailscale.js'),
                'utf-8',
              ),
            },
          },
          {
            script: {
              when: {
                regexp: {
                  message:
                    '^time="([^"]+)"\\s+level=(debug|info|warning|error|panic|fatal)\\s+msg="([^"]+)"$',
                },
              },
              lang: 'javascript',
              id: 'parse_vpnkit',
              source: fs.readFileSync(
                path.join(__dirname, 'processors', 'parse_vpnkit.js'),
                'utf-8',
              ),
            },
          },
          {
            script: {
              when: {
                regexp: {
                  message:
                    '^time="([^"]+)"\\s+level=(debug|info|warning|error|panic|fatal)\\s+msg="([^"]+)"$',
                },
              },
              lang: 'javascript',
              id: 'parse_filebeat',
              source: fs.readFileSync(
                path.join(__dirname, 'processors', 'parse_filebeat.js'),
                'utf-8',
              ),
            },
          },
          {
            script: {
              when: {
                regexp: {
                  message:
                    '^[IWEF](\\d{4} \\d{2}:\\d{2}:\\d{2}\\.\\d+)\\s+\\d+\\s+.*?](.*)$',
                },
              },
              lang: 'javascript',
              id: 'parse_klog',
              source: fs.readFileSync(
                path.join(__dirname, 'processors', 'parse_klog.js'),
                'utf-8',
              ),
            },
          },
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
  },
);
