## Setting up the Kubernetes operator

### Prerequisites

Tailscale Kubernetes Operator must be configured with OAuth client credentials.
The operator uses these credentials to manage devices via the Tailscale API and to
create auth keys for itself and the devices it manages.

1. In your [tailnet policy file](https://login.tailscale.com/admin/acls/file), create the tags `tag:k8s-operator` and `tag:k8s`,
   and make `tag:k8s-operator` an owner of `tag:k8s`.

If you want your Services to be exposed with tags other than the default `tag:k8s`,
create those as well and make `tag:k8s-operator` an owner.

Your tailnet policy should resemble something like this:

```
	"tagOwners": {
		"tag:k8s-operator": [],
		"tag:k8s":          ["tag:k8s-operator"],
		"tag:env-dev":      ["tag:k8s-operator"],
		"tag:env-test":     ["tag:k8s-operator"],
		"tag:env-prod":     ["tag:k8s-operator"],
	}
```

2. Create an OAuth client in the [OAuth clients page of the admin console](https://login.tailscale.com/admin/settings/oauth).
   Create the client with "Devices Core" and "Auth Keys" write scopes, and the
   tag "tag:k8s-operator".

The resultant client-id and client-secret must be added to the corresponding
Pulumi.yaml configuration.

You configuration file should resemble something like this:

```yaml
config:
  tailscale:
    clientId: 'clientid'
    clientSecret: 'tskey-client-x'
```
