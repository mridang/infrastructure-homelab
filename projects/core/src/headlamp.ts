import * as k8s from "@pulumi/kubernetes";
import provider from "./provider";
import {traefik} from "./traefik";

new k8s.helm.v3.Chart("headlamp", {
	chart: "headlamp",
	version: "0.28.0",
	fetchOpts: {
		repo: "https://headlamp-k8s.github.io/headlamp/",
	},
	values: {
		//
	},
});

new k8s.apiextensions.CustomResource(
	'headlamp-ingressroute',
	{
		apiVersion: 'traefik.io/v1alpha1',
		kind: 'IngressRoute',
		metadata: {
			name: 'headlamp-ingressroute',
			namespace: 'default',
		},
		spec: {
			entryPoints: ['websecure'],
			routes: [
				{
					match: 'Host(`headlamp.homelab.mrida.ng`)',
					kind: 'Rule',
					services: [
						{
							name: 'headlamp',
							port: 80,
						},
					],
				},
			],
			tls: {
				certResolver: 'letsencrypt',
			},
		},
	},
	{ provider, dependsOn: [traefik] },
);

new k8s.networking.v1.Ingress(
	'tailscale-headlamp-ingress',
	{
		metadata: {
			name: 'tailscale-headlamp-ingress',
		},
		spec: {
			ingressClassName: 'tailscale',
			defaultBackend: {
				service: {
					name: 'headlamp',
					port: {
						number: 80,
					},
				},
			},
			tls: [
				{
					hosts: ['headlamp'],
				},
			],
		},
	},
	{
		provider,
		dependsOn: traefik,
	},
);
