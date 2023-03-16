const config = {
	presets: [
		[
			'@babel/preset-env',
			{
				loose: true,
				modules: false,
			},
		],
		'@babel/preset-react',
		'@babel/preset-typescript',
	],
	plugins: [
		'@babel/plugin-proposal-class-properties',
		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-transform-modules-commonjs',
		'@babel/plugin-transform-runtime',
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

export { config };
