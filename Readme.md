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
