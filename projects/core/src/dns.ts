import * as k8s from '@pulumi/kubernetes';
import provider from './provider';

/**
 * CoreDNS is some scenarios is managed by the K8 environment and this means
 * that we need to edit the configuration that CoreDNS uses.
 *
 * After making any changes, you may need to restart CoreDNS using the following
 * command: .
 *
 * `kubectl rollout restart deployment coredns --namespace=kube-system`
 *
 *
 * To view logs about CoreDNS errors, use the following command:
 *
 * `kubectl logs --namespace=kube-system --selector=k8s-app=kube-dns --follow`
 */
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
                forward . tls://1.1.1.1 tls://1.0.0.1 {
                	tls_servername cloudflare-dns.com
       				health_check 5s
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
