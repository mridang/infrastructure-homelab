/**
 * @file Knip configuration that declares the entry points and ignored files for unused-code checks.
 */
export default {
  workspaces: {
    'projects/core': {
      entry: [
        'src/index.ts',
        'Pulumi.yaml',
        'src/elastic/scripts/index.ts',
        'test/setup.ts',
        'test/teardown.ts',
      ],
      ignore: ['src/elastic/beats/processors/*.ts'],
    },
  },
  ignoreBinaries: ['pulumi', 'kind'],
};
