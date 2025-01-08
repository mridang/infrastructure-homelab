import * as k8s from '@pulumi/kubernetes';
import provider from './provider';

new k8s.core.v1.ConfigMap(
  'coredns',
  {
    metadata: {
      name: 'coredns',
      namespace: 'kube-system',
      annotations: {
        'pulumi.com/patchForce': 'true',
      },
    },
    data: {
      Corefile: `
            .:53 {
                errors
                health {
                    lameduck 5s
                }
                ready
                kubernetes cluster.local in-addr.arpa ip6.arpa internal.mrida.ng {
                    pods insecure
                    fallthrough in-addr.arpa ip6.arpa
                    ttl 30
                }
                rewrite name regex  /(.*)-(.*)\\.internal\\.mrida\\.ng/ {1}.{2}.svc.cluster.local
                prometheus :9153
                forward . /etc/resolv.conf {
                    max_concurrent 1000
                }
                cache 30
                loop
                reload
                loadbalance
            }
        `,
    },
  },
  { provider, deleteBeforeReplace: true },
);
