import * as k8s from "@pulumi/kubernetes";
import provider from "./provider";
import {tlsSecret} from "./tls";
import {traefik} from "./service.traefik";

new k8s.helm.v3.Chart("nginx", {
	chart: "nginx",
	version: "18.2.1",
	fetchOpts: {
		repo: "https://charts.bitnami.com/bitnami",
	},
	values: {
		service: {
			type: "ClusterIP",
			port: 8080,
		},
	},
}, {provider});

new k8s.apiextensions.CustomResource("nginx-subdomain-ingressroute", {
	apiVersion: "traefik.io/v1alpha1",
	kind: "IngressRoute",
	metadata: {
		name: "nginx-subdomain-ingressroute",
		namespace: "default",
	},
	spec: {
		entryPoints: ["websecure"],
		routes: [
			{
				match: "Host(`nginx.internal.mrida.ng`)",
				kind: "Rule",
				middlewares: [
					{
						name: "nginx-compression",
					},
				],
				services: [
					{
						name: "nginx",
						port: 80,
					},
				],
			},
		],
		tls: {
			secretName: tlsSecret.metadata.name
		},
	},
}, {provider, dependsOn: [traefik]});
