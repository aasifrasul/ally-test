// Fix: Remove the incorrect import and use proper environment detection
const NODE_ENV = process.env.NODE_ENV;
const isDevelopment = NODE_ENV === 'development';

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
		[
			'@babel/preset-react',
			{
				runtime: 'automatic',
				// Enable development mode for better debugging
				development: isDevelopment,
			},
		],
		['@babel/preset-typescript', { allowNamespaces: true }],
	],
	plugins: [
		// Only add react-refresh/babel in development
		...(isDevelopment ? ['react-refresh/babel'] : []),
		[
			'@babel/plugin-transform-runtime',
			{
				regenerator: true,
				corejs: false,
				helpers: true,
				useESModules: true,
			},
		],
		'babel-plugin-macros',
	],
};

// Production optimizations
if (NODE_ENV === 'production') {
	config.plugins.push(
		'@babel/plugin-transform-react-constant-elements',
		'@babel/plugin-transform-react-inline-elements',
		'babel-plugin-transform-react-remove-prop-types',
	);
}

// Test environment configuration - enable CommonJS for Jest
if (NODE_ENV === 'test') {
	config.presets[0][1].modules = 'commonjs';
	// Find and update the transform-runtime plugin
	const transformRuntimePlugin = config.plugins.find(
		(plugin) => Array.isArray(plugin) && plugin[0] === '@babel/plugin-transform-runtime',
	);
	if (transformRuntimePlugin) {
		transformRuntimePlugin[1].useESModules = false;
	}
}

// Production environment-specific changes
if (NODE_ENV === 'prod') {
	config.plugins.push([
		'babel-plugin-react-remove-properties',
		{ properties: ['testId', 'data-aid', 'data-test-id'] },
	]);
}

module.exports = config;
