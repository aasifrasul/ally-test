import path from 'path';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import fs from 'fs';

import paths from './paths.js';
import webpackCommonConfig from '../webpack/webpack.common.js';
import LOADERS from '../webpack/loaders.js';
import PLUGINS from '../webpack/plugins.js';
import vendorlibs from './vendor.js';
import { APP_NAME, publicPath } from '../webpack/constants.js';
import { pathSource, pathRootDir, pathWebpackConfigs } from '../server/paths.js';

const isProduction = process.env.NODE_ENV === 'production';

export const makeConfig = () => {
	return {
		context: pathSource,
		mode: webpackCommonConfig.getNodeEnv(),
		target: ['web'],
		plugins: ['web'],
		recordsPath: path.join(pathRootDir, 'records.json'),
		parallelism: 1,
		profile: true,
		entry: {
			...(fs.existsSync(paths.langEn(pathWebpackConfigs)) && {
				en: paths.langEn(pathWebpackConfigs),
				hi: paths.langHi(pathWebpackConfigs),
			}),
			vendor: ['react', 'react-dom', 'react-router-dom', 'react-redux', 'redux-saga'],
			app: paths.appIndexJs(pathWebpackConfigs),
			webWorker: ['./workers/MyWorker.js'],
		},
		output: {
			path: isProduction ? path.join(paths.appBuild, APP_NAME) : paths.appBuildDev,
			filename: isProduction ? '[name].[chunkhash].js' : '[name].bundle.js',
			// publicPath: isProduction ? publicPath : '/public/',
			publicPath,
			pathinfo: !isProduction,
			chunkFilename: isProduction ? '[name].[chunkhash].js' : '[name].bundle.js',
			chunkLoadingGlobal: 'webpackJsonp',
			globalObject: `typeof self !== 'undefined' ? self : this`,
		},
		devServer: {
			hot: true,
			client: { overlay: false, logging: 'warn' },
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
			alias: {
				'fk-cp-utils': path.resolve(
					pathRootDir,
					'node_modules/@fpg-modules/fk-cp-utils'
				),
				'fk-ui-common': path.resolve(
					pathRootDir,
					'node_modules/@fpg-modules/fk-ui-common/src'
				),
				'fk-ui-common-components': path.resolve(
					pathRootDir,
					'node_modules/@fpg-modules/fk-ui-common/src/components'
				),
			},
		},
		performance: {
			maxEntrypointSize: 100000,
			maxAssetSize: 100000,
		},
		optimization: {
			minimizer: [webpackCommonConfig.getUglifyJs(), new OptimizeCssAssetsPlugin()],
			moduleIds: 'named',
			splitChunks: {
				cacheGroups: {
					default: false,
					defaultVendors: false,
					vendor: {
						name: 'vendor',
						test: new RegExp(
							`[\\/]node_modules[\\/](${vendorlibs.join('|')})[\\/]`
						),
						enforce: true,
						minChunks: 1,
						priority: 1,
					},
					common: {
						chunks: 'all',
						name: 'common',
						minChunks: 2,
						priority: 2,
					},
				},
			},
		},
		stats: {
			colors: true,
			version: true,
		},
		module: {
			rules: LOADERS,
		},
		plugins: PLUGINS,
		devtool: isProduction ? 'hidden-source-map' : 'eval-source-map',
	};
};

// PROD && (CONFIG.devtool = 'hidden-source-map');
