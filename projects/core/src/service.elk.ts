import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import provider from "./provider";

const elasticsearch = new k8s.helm.v3.Chart("elasticsearch", {
	chart: "elasticsearch",
	fetchOpts: {
		repo: "https://helm.elastic.co",
	},
	values: {
		//protocol: 'http',
		createCert: true,
		replicas: 1,
		esJavaOpts: "-Xmx1g -Xms1g",
		service: {
			type: "NodePort",
			port: 9200,
		},
	},
}, { provider });

const elasticsearchHost = pulumi.interpolate`https://${elasticsearch.getResource("v1/Service", "elasticsearch-master").metadata.name}:9200`;

// const kibana = new k8s.helm.v3.Chart("kibana", {
// 	chart: "kibana",
// 	version: "8.5.1",
// 	fetchOpts: {
// 		repo: "https://helm.elastic.co",
// 	},
// 	values: {
// 		elasticsearchHosts: elasticsearchHost,
// 		replicas: 1,
// 		service: {
// 			type: "NodePort",
// 			port: 5601,
// 		},
// 	},
// }, { provider });

const elasticsearchService = elasticsearch.getResource("v1/Service", "elasticsearch-master");
//const kibanaService = kibana.getResource("v1/Service", "kibana");

export const elasticsearchUrl = elasticsearchService.status.loadBalancer.ingress[0].hostname;
//export const kibanaUrl = kibanaService.status.loadBalancer.ingress[0].hostname;
