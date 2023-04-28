const webpack = require('webpack');
const path = require('path');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ATL = require('awesome-typescript-loader');
const CompressionPlugin = require('compression-webpack-plugin');
const CssExtractPlugin = require('mini-css-extract-plugin');
const FkEmitAssetsPlugin = require('./fk-emit-assets-plugin');
const Visualizer = require('webpack-visualizer-plugin');
const StatsPlugin = require('stats-webpack-plugin');
const webpackCommonConfig = require('./webpack.common');
const DEV = process.env.NODE_ENV !== 'production';
const PROD = !DEV;
const Constants = require('./constants');
const PATHS = {
	src: path.join(__dirname, '..', 'src'),
	build: path.join(__dirname, '..', 'build'),
	public: path.join(__dirname, '..', ''),
};

let plugins = [
	/**
	 * Set up environment variables for our plugins and dependencies
	 * Source: https://webpack.js.org/plugins/define-plugin/
	 */
	new webpack.DefinePlugin({
		'process.env.BUILD_TYPE': JSON.stringify(process.env.BUILD_TYPE),
		__DEV__: DEV,
		__PROD__: PROD,
	}),
	/**
	 * Custom plugin to generate a list of assets which can be used by
	 * make.hbs file to generate the hbs template with the assets to be served
	 */
	new FkEmitAssetsPlugin({
		fileName: Constants.APP_NAME + '.json',
	}),

	new webpack.LoaderOptionsPlugin({
		options: {
			devServer: {
				inline: true,
				hot: true,
			},
		},
		minimize: true,
	}),

	/**
	 * Optional plugin that allows awesome-typescript-loader to
	 * report errors asynchronously
	 * Source: https://github.com/s-panferov/awesome-typescript-loader
	 */
	new ATL.CheckerPlugin(),

	DEV && new ReactRefreshWebpackPlugin(),

	/**
	 * Creates smaller builds by discarding unused lodash modules
	 * Source: https://github.com/lodash/lodash-webpack-plugin
	 */
	// new LodashModuleReplacementPlugin({
	//   paths: true
	// })
];

// DEV && plugins.push(new webpack.NamedModulesPlugin());

if (PROD) {
	plugins = plugins.concat([
		/**
		 * This plugin generates hashes based on the relative path of the module,
		 * and uses them for module-ids. This helps with long-term caching of generated assets.
		 * Source: https://webpack.js.org/plugins/hashed-module-ids-plugin/
		 */
		// new webpack.HashedModuleIdsPlugin(),

		/**
		 * Extract CSS from a bundle, or bundles, into a separate file
		 * Source: https://github.com/webpack-contrib/mini-css-extract-plugin
		 */
		new CssExtractPlugin({
			filename: '[name].[contenthash:20].css',
			chunkFilename: '[name].[contenthash:20].css',
		}),

		/**
		 * Prepare compressed versions of assets to serve them with Content-Encoding
		 * Source: https://github.com/webpack-contrib/compression-webpack-plugin
		 */
		new CompressionPlugin({
			asset: '[path][query]',
			algorithm: 'gzip',
			test: /\.js$|\.css$|\.svg$/,
		}),

		/**
		 * This plugin helps visualize and analyze your Webpack bundle to see which
		 * modules are taking up space and which might be duplicates.
		 * Source: https://github.com/chrisbateman/webpack-visualizer
		 */
		new Visualizer({
			filename: './statistics.html',
		}),
		/**
		 * Writes the stats of a build to a file.
		 * Source: https://github.com/unindented/stats-webpack-plugin/
		 */
		new StatsPlugin('stats.json', {
			chunkModules: true,
			version: true,
			timings: true,
			exclude: [/node_modules[/]react/],
		}),
	]);
}

module.exports = plugins;
