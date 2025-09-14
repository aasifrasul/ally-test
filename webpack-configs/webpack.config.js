const path = require('path');
const paths = require('./paths');
const { getMinimizers, getNodeEnv } = require('../webpack/webpack.common');
const fs = require('fs');
const LOADERS = require('../webpack/loaders');
const PLUGINS = require('../webpack/plugins');
const isProduction = process.env.NODE_ENV === 'production';
const { APP_NAME, publicPath } = require('../webpack/constants');

const makeConfig = () => {
	const baseConfig = {
		context: path.join(__dirname, '..', 'src'),
		mode: getNodeEnv(),
		target: ['web'],
		devtool: isProduction ? 'hidden-source-map' : 'eval-cheap-module-source-map',
		entry: {
			...(fs.existsSync(paths.langEn(__dirname)) && {
				en: paths.langEn(__dirname),
				hi: paths.langHi(__dirname),
			}),
			app: paths.appIndexJs(__dirname),
		},
		output: {
			path: isProduction ? path.join(paths.appBuild, APP_NAME) : paths.appBuildDev,
			filename: isProduction ? '[name].[chunkhash].js' : '[name].bundle.js',
			publicPath,
			pathinfo: !isProduction,
			chunkFilename: isProduction ? '[name].[chunkhash].js' : '[name].bundle.js',
			chunkLoadingGlobal: 'webpackJsonp',
		},
		resolve: {
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
			modules: [
				'common',
				'node_modules',
				'components',
				'actions',
				'states',
				'stores',
				'helpers',
				'utils',
				'images',
				'mocks',
			],
		},
		performance: {
			maxEntrypointSize: 100000,
			maxAssetSize: 100000,
		},
		optimization: {
			minimize: isProduction,
			minimizer: isProduction ? getMinimizers() : [],
			splitChunks: isProduction
				? {
						chunks: 'all',
						cacheGroups: {
							vendor: {
								test: /[\\/]node_modules[\\/]/,
								name: 'vendor',
								chunks: 'all',
								enforce: true,
								priority: 1,
							},
							common: {
								name: 'common',
								chunks: 'all',
								minChunks: 2,
								priority: 2,
								enforce: true,
							},
						},
					}
				: false,
			moduleIds: isProduction ? 'deterministic' : 'named',
		},

		stats: {
			colors: true,
			version: true,
		},
		module: {
			rules: LOADERS,
		},
		plugins: PLUGINS,
	};

	// For development, configure HMR without starting a dev server
	if (!isProduction) {
		// Add webpack-hot-middleware client entry point to all entries
		Object.keys(baseConfig.entry).forEach((entryName) => {
			if (Array.isArray(baseConfig.entry[entryName])) {
				baseConfig.entry[entryName].unshift(
					'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=false&quiet=false&noInfo=false',
				);
			} else {
				baseConfig.entry[entryName] = [
					'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=false&quiet=false&noInfo=false',
					baseConfig.entry[entryName],
				];
			}
		});

		// Configure output for HMR
		//baseConfig.output.hotUpdateChunkFilename = '[id].[fullhash].hot-update.js';
		//baseConfig.output.hotUpdateMainFilename = '[fullhash].hot-update.json';

		// Ensure HMR is enabled
		baseConfig.optimization.moduleIds = 'named';
		baseConfig.optimization.chunkIds = 'named';
	}

	return baseConfig;
};

module.exports = makeConfig();
