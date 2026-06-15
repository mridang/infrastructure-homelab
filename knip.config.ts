export default {
  entry: [
    'projects/**/src/index.ts',
    'projects/**/Pulumi.yaml',
    'projects/core/src/elastic/beats/processors/parse_*.ts',
    'projects/core/src/elastic/beats/processors/event.ts',
    'projects/core/src/elastic/scripts/index.ts',
    'projects/core/test/deploy.test.ts',
    'projects/core/test/setup.ts',
    'projects/core/test/teardown.ts',
  ],
  ignore: ['knip.config.ts'],
  ignoreDependencies: [/^@semantic-release\//],
  ignoreBinaries: ['pulumi'],
};
