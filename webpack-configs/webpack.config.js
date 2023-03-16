import path from 'path';
import fs from 'fs';
import OptimizeCssAssetsPlugin from 'optimize-css-assets-webpack-plugin';

import { langEn, langHi, appIndexJs, appBuild, appBuildDev } from './paths.js';
import { getNodeEnv, getUglifyJs } from '../webpack/webpack.common.js';
import { loaders } from '../webpack/loaders.js';
import { plugins } from '../webpack/plugins.js';
import { vendorlibs } from './vendor.js';
import { APP_NAME, publicPath } from '../webpack/constants.js';

const isProduction = process.env.NODE_ENV === 'production';

const webpackConfig = {
	context: path.resolve('..', 'src'),
	mode: getNodeEnv(),
	target: 'web',
	recordsPath: path.resolve('..', 'records.json'),
	parallelism: 1,
	profile: true,
	entry: {
		...(fs.existsSync(langEn(path.resolve('..'))) && {
			en: langEn(path.resolve('..')),
			hi: langHi(path.resolve('..')),
		}),
		app: appIndexJs(path.resolve('..')),
	},
	output: {
		path: isProduction ? path.resolve(appBuild, APP_NAME) : appBuildDev,
		filename: isProduction ? '[name].[chunkhash].js' : '[name].bundle.js',
		// publicPath: isProduction ? publicPath : '/public/',
		publicPath,
		pathinfo: !isProduction,
		chunkFilename: isProduction ? '[name].[chunkhash].js' : '[name].bundle.js',
		jsonpFunction: 'webpackJsonp',
	},
	devServer: {
		hot: true,
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
			'fk-cp-utils': path.resolve('..', 'node_modules/@fpg-modules/fk-cp-utils'),
			'fk-ui-common': path.resolve('..', 'node_modules/@fpg-modules/fk-ui-common/src'),
			'fk-ui-common-components': path.resolve('', '..', 'node_modules/@fpg-modules/fk-ui-common/src/components'),
		},
	},
	performance: {
		maxEntrypointSize: 100000,
		maxAssetSize: 100000,
	},
	optimization: {
		minimizer: [getUglifyJs(), new OptimizeCssAssetsPlugin()],
		namedModules: true,
		splitChunks: {
			name: true,
			cacheGroups: {
				default: false,
				vendors: false,
				vendor: {
					name: 'vendor',
					test: new RegExp(`[\\/]node_modules[\\/](${vendorlibs.join('|')})[\\/]`),
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
		rules: loaders,
	},
	plugins: plugins,
	devtool: isProduction ? 'hidden-source-map' : 'eval-source-map',
};

// PROD && (CONFIG.devtool = 'hidden-source-map');

export { webpackConfig };
