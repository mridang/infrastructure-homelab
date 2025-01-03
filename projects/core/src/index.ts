import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import './dns'
import './service.elk'
import provider from "./provider";
import * as fs from "node:fs";
import * as path from "node:path";

const certPath = path.resolve(__dirname, "../../../etc/archive/internal.mrida.ng/fullchain1.pem");
const keyPath = path.resolve(__dirname, "../../../etc/archive/internal.mrida.ng/privkey1.pem");

console.log(certPath)

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
				exposedPort: 8080, // The external port
				nodePort: 32000, // Optional: specify a NodePort
				protocol: "TCP",
			},
		},
		ingressRoute: {
			dashboard: {
				enabled: true
			},
			healthcheck: {
				enabled: true
			}
		},
	},
}, {provider});


const nginx = new k8s.helm.v3.Chart("nginx", {
	chart: "nginx",
	version: "13.2.1", // The version of the NGINX Helm chart
	fetchOpts: {
		repo: "https://charts.bitnami.com/bitnami", // Bitnami Helm chart repository URL
	},
	values: {
		service: {
			type: "ClusterIP",
			port: 8080,
		},
	},
}, {provider});

const nginxIngressRoute = new k8s.apiextensions.CustomResource("nginx-ingressroute", {
	apiVersion: "traefik.io/v1alpha1",
	kind: "IngressRoute",
	metadata: {
		name: "nginx-ingressroute",
		namespace: "default",
	},
	spec: {
		entryPoints: ["websecure"], // HTTP entry point
		routes: [
			{
				match: "PathPrefix(`/nginx`)", // Route traffic with /nginx prefix
				kind: "Rule",
				middlewares: [
					{
						name: "strip-nginx-prefix", // Use the strip middleware
					},
				],
				services: [
					{
						name: "nginx", // NGINX service name
						port: 80,
					},
				],
			},
		],
		tls: {
			secretName: tlsSecret.metadata.name,
		}
	},
}, {provider});

const stripMiddleware = new k8s.apiextensions.CustomResource("strip-nginx-prefix", {
	apiVersion: "traefik.io/v1alpha1",
	kind: "Middleware",
	metadata: {
		name: "strip-nginx-prefix",
		namespace: "default",
	},
	spec: {
		stripPrefix: {
			prefixes: ["/nginx"],
		},
	},
}, {provider});

const nginxService = nginx.getResource("v1/Service", "nginx");

// Correctly handle the service metadata and export the URL
export const nginxServiceUrl = nginxService.status.loadBalancer
	? nginxService.status.loadBalancer.ingress[0].hostname
	: pulumi.interpolate`http://localhost:8080`; // fallback for NodePort
