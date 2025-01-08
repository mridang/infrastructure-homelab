import * as k8s from "@pulumi/kubernetes";
import provider from "./provider";

export const traefik = new k8s.helm.v3.Chart("traefik", {
	chart: "traefik",
	version: "33.2.1",
	fetchOpts: {
		repo: "https://helm.traefik.io/traefik",
	},
	values: {
		deployment: {
			additionalVolumes: [
				{
					name: "traefik-logs",
					emptyDir: {}  // This ensures the logs are stored in an ephemeral directory
				}
			]
		},
		additionalVolumeMounts: [
			{
				name: "traefik-logs",
				mountPath: "/var/log/traefik",
				readOnly: false,
			},
		],
		logs: {
			general: {
				level: 'INFO',
				filePath: "/var/log/traefik/general.log"
			},
			access: {
				enabled: true,
				filePath: "/var/log/traefik/access.log"
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
						name: "compression-middleware",
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

new k8s.apiextensions.CustomResource("compression-middleware", {
	apiVersion: "traefik.io/v1alpha1",
	kind: "Middleware",
	metadata: {
		name: "compression--middleware",
		namespace: "default",
	},
	spec: {
		compress: {

		},
	},
}, {provider});
