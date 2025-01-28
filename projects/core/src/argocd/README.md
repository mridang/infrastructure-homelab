#### Credentials

```
kubectl get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

### Setup

3. ssh-keygen -t rsa -b 4096 -C "homelab@internal.mrida.ng" -f ./id_rsa_k8
4. cat id_rsa_k8.pub | pbcopy
5. Create a new key and add it here https://github.com/settings/keys
