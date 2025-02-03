const mridangPlugin = require('@mridang/eslint-defaults');
const nxPlugin = require('@nx/eslint-plugin');
const pulumiPlugin = require('@pulumi/eslint-plugin');

module.exports = [
  ...mridangPlugin.configs.recommended,
  { plugins: { '@nx': nxPlugin } },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
    rules: {
      '@nx/enforce-module-boundaries': ['error'],
      '@nx/dependency-checks': ['error'],
    },
  },
];
