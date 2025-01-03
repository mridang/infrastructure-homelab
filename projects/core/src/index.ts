import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import './dns'
import './service.elk'
import provider from "./provider";
import * as fs from "node:fs";
import * as path from "node:path";

const certPath = path.resolve(__dirname, "../../../etc/archive/internal.mrida.ng/fullchain1.pem");
const keyPath = path.resolve(__dirname, "../../../etc/archive/internal.mrida.ng/privkey1.pem");

const tlsSecret = new k8s.core.v1.Secret("internal-mrida-tls", {
	metadata: {
		name: "internal-mrida-tls",
		namespace: "default",
	},
	type: "kubernetes.io/tls",
	data: {
		"tls.crt": Buffer.from(fs.readFileSync(certPath)).toString("base64"),
		"tls.key": Buffer.from(fs.readFileSync(keyPath)).toString("base64"),
	},
}, {provider});

const traefik = new k8s.helm.v3.Chart("traefik", {
	chart: "traefik",
	version: "33.2.1",
	fetchOpts: {
		repo: "https://helm.traefik.io/traefik",
	},
	values: {
		logs: {
			general: {
				level: 'TRACE'
			},
			access: {
				enabled: true,
			}
		},
		ports: {
			traefik: {
				expose: {
					default: true
				},
				exposedPort: 8080,
				nodePort: 32000,
				protocol: "TCP",
			},
			websecure: {
				http3: {
					enabled: true,
				}
			}
		},
		ingressRoute: {
			dashboard: {
				enabled: true,
				tls: {
					secretName: "internal-mrida-tls",
				},
				entryPoints: ["websecure", "traefik"],
				matchRule: "Host(`traefik.internal.mrida.ng`)"
			},
			healthcheck: {
				enabled: true
			}
		},
	},
}, {provider});

const nginx = new k8s.helm.v3.Chart("nginx", {
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

const nginxSubdomainIngressRoute = new k8s.apiextensions.CustomResource("nginx-subdomain-ingressroute", {
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
}, {provider});

const nginxService = nginx.getResource("v1/Service", "nginx");

// Correctly handle the service metadata and export the URL
export const nginxServiceUrl = nginxService.status.loadBalancer
	? nginxService.status.loadBalancer.ingress[0].hostname
	: pulumi.interpolate`http://localhost:8080`;
