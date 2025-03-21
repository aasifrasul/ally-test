const config = {
	presets: [
		[
			'@babel/preset-env',
			{
				loose: true,
				modules: false,
				targets: { node: 'current' },
			},
		],
		['@babel/preset-react', { runtime: 'automatic' }],
		['@babel/preset-typescript', { allowNamespaces: true }],
	],
	plugins: [
		'@babel/plugin-transform-typescript',
		'@babel/plugin-proposal-object-rest-spread',
		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-transform-modules-commonjs',
		'@babel/plugin-transform-runtime',
		['@babel/plugin-proposal-class-properties', { loose: true }],
		['@babel/plugin-proposal-private-methods', { loose: true }],
		['@babel/plugin-proposal-private-property-in-object', { loose: true }],
		'macros',
	],
};

if ('production' === process.env.NODE_ENV) {
	config.plugins = config.plugins.concat([
		'@babel/plugin-transform-react-constant-elements',
		'@babel/plugin-transform-react-inline-elements',
		'babel-plugin-transform-react-remove-prop-types',
	]);
}

if ('test' === process.env.NODE_ENV) {
	config.presets = ['@babel/preset-env', '@babel/preset-react'];
}

if ('prod' === process.env.PROMOTION_ENV) {
	config.plugins.push([
		'babel-plugin-react-remove-properties',
		{ properties: ['testId', 'data-aid', 'data-test-id'] },
	]);
}

module.exports = config;
