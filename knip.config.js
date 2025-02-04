module.exports = {
	entry: ['projects/**/src/index.{ts,tsx}'],
	ignore: [
		'projects/core/src/elastic/beats/processors/**',
		'projects/core/src/elastic/scripts/index.ts',
	],
	ignoreBinaries: ['pulumi'],
};
