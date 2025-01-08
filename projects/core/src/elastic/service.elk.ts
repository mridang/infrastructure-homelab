import * as k8s from "@pulumi/kubernetes";
import {tlsSecret} from "../tls";
import provider from "../provider";
import {ELASTIC_VERSION} from "./constants";

const eckOperatorNamespace = new k8s.core.v1.Namespace("eck-operator", {
	metadata: {
		name: "elastic-system"
	},
});

new k8s.helm.v3.Release("eck-operator", {
	namespace: eckOperatorNamespace.metadata.name,
	chart: "eck-operator",
	version: "2.16.0",
	repositoryOpts: {
		repo: "https://helm.elastic.co",
	},
});

export const elasticsearchCluster = new k8s.apiextensions.CustomResource("elasticsearch-cluster", {
	apiVersion: "elasticsearch.k8s.elastic.co/v1",
	kind: "Elasticsearch",
	metadata: {name: "my-cluster"},
	spec: {
		version: ELASTIC_VERSION,
		http: {
			tls: {
				selfSignedCertificate: {
					disabled: true,
				},
			},
		},
		nodeSets: [
			{
				name: "default",
				count: 1,
				config: {
					"node.store.allow_mmap": "false",
				},
				volumeClaimTemplates: [
					{
						metadata: {name: "elasticsearch-data"},
						spec: {
							accessModes: ["ReadWriteOnce"],
							storageClassName: "hostpath",
							resources: {requests: {storage: "10Gi"}},
						},
					},
				],
			},
		],
	},
});

new k8s.apiextensions.CustomResource("kibana-instance", {
	apiVersion: "kibana.k8s.elastic.co/v1",
	kind: "Kibana",
	metadata: {name: "my-kibana"},
	spec: {
		version: ELASTIC_VERSION,
		http: {
			tls: {
				selfSignedCertificate: {
					disabled: true,
				},
			},
		},
		count: 1,
		elasticsearchRef: {name: elasticsearchCluster.metadata.name},
	},
});

new k8s.apiextensions.CustomResource("kibana-ingressroute", {
	apiVersion: "traefik.io/v1alpha1",
	kind: "IngressRoute",
	metadata: {
		name: "kibana-ingressroute",
		namespace: "default",
	},
	spec: {
		entryPoints: ["websecure"],
		routes: [
			{
				match: "Host(`kibana.internal.mrida.ng`)",
				kind: "Rule",
				services: [
					{
						name: "my-kibana-kb-http",
						port: 5601,
					},
				],
			},
		],
		tls: {
			secretName: tlsSecret.metadata.name
		},
	},
}, {
	provider
});

new k8s.apiextensions.CustomResource("apm-server-instance", {
	apiVersion: "apm.k8s.elastic.co/v1",
	kind: "ApmServer",
	metadata: {
		name: "my-apm-server",
	},
	spec: {
		version: ELASTIC_VERSION,
		http: {
			tls: {
				selfSignedCertificate: {
					disabled: true, //Secret token is set, but SSL is not enabled
				},
			},
		},
		count: 1,
		elasticsearchRef: {name: elasticsearchCluster.metadata.name},
		config: {
			"apm-server.rum.enabled": "true",
			"apm-server.rum.allowed_origins": ["*"],
		},
	},
}, {
	provider
});
