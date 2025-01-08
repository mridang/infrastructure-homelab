### Setting up SSL

Once you've set up the Cloudflare credentials, you'll need to run

```
docker run -it --rm -v $(pwd)/etc:/etc/letsencrypt -v $(pwd):/certs certbot/dns-cloudflare certonly --dns-cloudflare --dns-cloudflare-credentials /certs/cloudflare.ini -d "internal.mrida.ng,*.internal.mrida.ng" --preferred-challenges dns-01
```

This will prompt you for a confirmation and your email address then
save the issued certs under the `etc` directory.

kubectl delete configmap kibana-kibana-helm-scripts -n default
kubectl delete serviceaccount pre-install-kibana-kibana -n default
kubectl delete roles pre-install-kibana-kibana -n default
kubectl delete rolebindings pre-install-kibana-kibana -n default
kubectl delete job pre-install-kibana-kibana -n default

##### ECK (Operator)

Each pod runs a sidecar to collect application-specific logs if needed but along
with that a generic DaemonSet is run to collect application logs.

##### Nginx (Chart)

Nginx is used to serve a simple hello-world page. This acts as a lightweight
container that can be used for testing

##### Traefik (Chart)

Traefik is used as the ingress controller for the cluster.

##### Dashboard (Chart)

The default K8 dashboard is deployed so that we can inspect the cluster.

### TODO

Set up Cert Manager
Set up Tailscale
Use 1.1.1.1 as DNS
