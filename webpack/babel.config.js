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
		// Transform runtime for efficient helper usage
		[
			'@babel/plugin-transform-runtime',
			{
				regenerator: true,
				corejs: false,
				helpers: true,
				useESModules: true, // Since modules: false in preset-env
			},
		],
		// Macro support
		'babel-plugin-macros',
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

// Test environment configuration - enable CommonJS for Jest
if (process.env.NODE_ENV === 'test') {
	// Override preset-env for test to use CommonJS modules
	config.presets[0][1].modules = 'commonjs';
	config.plugins[0][1].useESModules = false; // Adjust transform-runtime for CommonJS
}

// Production environment-specific changes
if (process.env.PROMOTION_ENV === 'prod') {
	config.plugins.push([
		'babel-plugin-react-remove-properties',
		{ properties: ['testId', 'data-aid', 'data-test-id'] },
	]);
}

module.exports = config;
