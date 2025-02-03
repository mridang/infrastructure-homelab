## Elastic

### Prerequisites

```
kubectl get secret my-cluster-es-elastic-user -o=jsonpath='{.data.elastic}' | base64 --decode
```

```
kubectl get secret my-apm-server-apm-token -o jsonpath='{.data.secret-token}' | base64 --decode
```

### Debugging

### Upgrading

### Issues

- Unable to upgrade
- No SSL
- No orchestrator.cluster.name set

### Guides

To delete all docs.

```
POST /filebeat-8.5.0/_rollover
POST /.ds-filebeat-8.5.0-2025.01.17-000001/_delete_by_query
{
  "query": {
    "match_all": {}
  }
}
```

##### Reconciliation does not work at times

```
pulumi up --replace=urn:pulumi:dev::homelab-test::kubernetes:beat.k8s.elastic.co/v1beta1:Beat::filebeat
```
