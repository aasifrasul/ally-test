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
		// Use modern transform plugin naming convention
		'@babel/plugin-transform-typescript',
		'@babel/plugin-transform-object-rest-spread', // Updated from proposal
		'@babel/plugin-syntax-dynamic-import',
		'@babel/plugin-transform-modules-commonjs',
		'@babel/plugin-transform-runtime',
		['@babel/plugin-transform-class-properties', { loose: true }], // Updated from proposal
		['@babel/plugin-transform-private-methods', { loose: true }], // Updated from proposal
		['@babel/plugin-transform-private-property-in-object', { loose: true }], // Updated from proposal
		'babel-plugin-macros', // Full name for clarity
	],
};

// Production optimizations
if (process.env.NODE_ENV === 'production') {
	config.plugins.push(
		'@babel/plugin-transform-react-constant-elements',
		'@babel/plugin-transform-react-inline-elements',
		'babel-plugin-transform-react-remove-prop-types',
	);
}

// Test environment configuration
if (process.env.NODE_ENV === 'test') {
	config.presets = ['@babel/preset-env', '@babel/preset-react'];
}

// Production environment-specific changes
if (process.env.PROMOTION_ENV === 'prod') {
	config.plugins.push([
		'babel-plugin-react-remove-properties',
		{ properties: ['testId', 'data-aid', 'data-test-id'] },
	]);
}

module.exports = config;
