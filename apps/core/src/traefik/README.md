## Traefik

Traefik is a Kubernetes ingress controller.

https://artifacthub.io/packages/helm/traefik/traefik

### Debugging

Increase the logging verbosity to see any potential issues. This can be done by
simply changing the log-level in the chart.

One of the recurring issues is that you may not see the route in the Traefik
dashboard and this happens when there is mismatch of the port in the ingress-route
CRD.

### Upgrading

To upgrade the underlying version of Traefik, you will need to set the necessary
version in the `image.tag` property. This should work in most cases unless there
are breaking changes in the Helm chart.

### Issues

- It is not possible to store the certificates anywhere else but on disk.
-
