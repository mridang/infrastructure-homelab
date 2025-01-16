## ExternalDNS

ExternalDNS is a Kubernetes service that automatically creates DNS records.

https://artifacthub.io/packages/helm/external-dns/external-dns

### Usage

ExternalDNS automatically creates DNS records for multiple sources. The provider
that is used is [Cloudflare](https://github.com/kubernetes-sigs/external-dns/blob/v0.15.1/docs/tutorials/cloudflare.md)
and [CoreDNS](https://github.com/kubernetes-sigs/external-dns/blob/v0.15.1/docs/tutorials/coredns.md)

In this setup, we only configure the sources to be [`traefik.io/v1alpha1/IngressRoute`](https://github.com/traefik/traefik/blob/v3.3/docs/content/routing/providers/kubernetes-crd.md#kind-ingressroute)

All the public facing services are fronted by Traefik and that is the reason why we
only limit it to that CRD.

To create a DNS record for given route, the service must be annotated with:

```
'external-dns.alpha.kubernetes.io/hostname': 'nginx.homelab.mrida.ng'
```


### Upgrading

To upgrade the underlying version of ExternalDNS, you will need to set the necessary
version in the `image.tag` property.
