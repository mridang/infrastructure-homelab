import * as k8s from '@pulumi/kubernetes';
import provider from './provider';

new k8s.helm.v3.Chart(
	'statuspage',
	{
		chart: 'nginx',
		version: '18.2.1',
		fetchOpts: {
			repo: 'https://charts.bitnami.com/bitnami',
		},
		values: {
			service: {
				type: 'ClusterIP',
				port: 8080,
			},
		},
	},
	{ provider },
);

new k8s.apiextensions.CustomResource(
	'statuspage-subdomain-ingressroute',
	{
		apiVersion: 'traefik.io/v1alpha1',
		kind: 'IngressRoute',
		metadata: {
			name: 'statuspage-subdomain-ingressroute',
			namespace: 'default',
		},
		spec: {
			entryPoints: ['websecure'],
			routes: [
				{
					match: 'Host(`status.internal.mrida.ng`)',
					kind: 'Rule',
					middlewares: [
						{
							name: 'compression-middleware',
						},
					],
					services: [
						{
							name: 'statuspage',
							port: 80,
						},
					],
				},
			],
			tls: {
				secretName: 'internal-mrida-tls',
			},
		},
	},
	{ provider },
);
