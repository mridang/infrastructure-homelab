import * as k8s from "@pulumi/kubernetes";
import provider from "./provider";

export const traefik = new k8s.helm.v3.Chart("traefik", {
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
				middlwares: [
					{
						name: "nginx-compression",
					},
				],
				matchRule: "Host(`traefik.internal.mrida.ng`)"
			},
			healthcheck: {
				enabled: true
			}
		},
	},
}, {provider});

new k8s.apiextensions.CustomResource("nginx-compression-middleware", {
	apiVersion: "traefik.io/v1alpha1",
	kind: "Middleware",
	metadata: {
		name: "nginx-compression",
		namespace: "default",
	},
	spec: {
		compress: {},
	},
}, {provider});
