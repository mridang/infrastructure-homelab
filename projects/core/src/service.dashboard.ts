import * as k8s from '@pulumi/kubernetes';
import provider from './provider';
import { tlsSecret } from './tls';
import { traefik } from './service.traefik';

new k8s.helm.v3.Chart(
  'kubernetes-dashboard',
  {
    chart: 'kubernetes-dashboard',
    version: '6.0.8',
    fetchOpts: {
      repo: 'https://kubernetes.github.io/dashboard',
    },
    values: {
      service: {
        type: 'ClusterIP',
        port: 80,
        externalPort: 80,
      },
      protocolHttp: true,
      rbac: {
        clusterReadOnlyRole: true,
        clusterReadOnlyRoleAdditionalRules: [
          {
            apiGroups: ['apiextensions.k8s.io'],
            resources: ['customresourcedefinitions'],
            verbs: ['get', 'list', 'watch'],
          },
          {
            apiGroups: [''],
            resources: ['secrets'],
            verbs: ['get', 'list', 'watch'],
          },
          {
            apiGroups: ['networking.k8s.io'],
            resources: ['ingressclasses'],
            verbs: ['get', 'list', 'watch'],
          },
        ],
      },
    },
  },
  { provider },
);

new k8s.apiextensions.CustomResource(
  'dashboard-ingressroute',
  {
    apiVersion: 'traefik.io/v1alpha1',
    kind: 'IngressRoute',
    metadata: {
      name: 'dashboard-ingressroute',
      namespace: 'default',
    },
    spec: {
      entryPoints: ['websecure'],
      routes: [
        {
          match: 'Host(`kubernetes.internal.mrida.ng`)',
          kind: 'Rule',
          services: [
            {
              name: 'kubernetes-dashboard',
              port: 80,
            },
          ],
        },
      ],
      tls: {
        secretName: tlsSecret.metadata.name,
      },
    },
  },
  { provider, dependsOn: [traefik] },
);
