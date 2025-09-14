const webpack = require('webpack');
const CompressionPlugin = require('compression-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const EmitAssetsPlugin = require('./emit-assets-plugin');
const Visualizer = require('webpack-visualizer-plugin');
const StatsPlugin = require('stats-webpack-plugin');
const DEV = process.env.NODE_ENV !== 'production';
const PROD = !DEV;
const Constants = require('./constants');

let plugins = [
	/**
	 * Set up environment variables for our plugins and dependencies
	 * Source: https://webpack.js.org/plugins/define-plugin/
	 */
	new webpack.DefinePlugin({
		'process.env.BUILD_TYPE': JSON.stringify(process.env.BUILD_TYPE),
		//'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
		__DEV__: DEV,
		__PROD__: PROD,
	}),

	/**
	 * Custom plugin to generate a list of assets which can be used by
	 * make.hbs file to generate the hbs template with the assets to be served
	 */
	new EmitAssetsPlugin({
		fileName: Constants.APP_NAME + '.json',
	}),

	/**
	 * Extract CSS from a bundle, or bundles, into a separate file
	 * Source: https://github.com/webpack-contrib/mini-css-extract-plugin
	 */
	new MiniCssExtractPlugin({
		filename: PROD ? '[name].[contenthash:20].css' : '[name].css',
		chunkFilename: PROD ? '[name].[contenthash:20].css' : '[name].css',
		// Remove experimentalUseImportModule as it's deprecated in webpack 5
	}),
];

// Development-specific plugins for HMR
if (DEV) {
	plugins = plugins.concat([
		/**
		 * Traditional HMR plugin - needed for webpack-hot-middleware
		 */
		new webpack.HotModuleReplacementPlugin(),

		/**
		 * React Fast Refresh for better HMR experience
		 * Works alongside HotModuleReplacementPlugin
		 */
		new ReactRefreshWebpackPlugin({
			overlay: false,
		}),
	]);
}

// Production-specific plugins
if (PROD) {
	plugins = plugins.concat([
		/**
		 * Prepare compressed versions of assets to serve them with Content-Encoding
		 * Source: https://github.com/webpack-contrib/compression-webpack-plugin
		 */
		new CompressionPlugin({
			filename: '[path][base].gz', // Updated for webpack 5
			algorithm: 'gzip',
			test: /\.(js|css|svg)$/,
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
