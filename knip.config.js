module.exports = {
  entry: ['{apps,libs}/**/src/index.{ts,tsx}'],
  ignore: [
    'apps/core/src/elastic/beats/processors/**',
    'apps/core/src/elastic/scripts/index.ts',
  ],
  ignoreBinaries: ['pulumi'],
};
