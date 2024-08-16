const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const webpack = require('webpack');
const DEV = process.env.NODE_ENV !== 'production';
const APP_NAME = 'credit';
const CompressionPlugin = require('compression-webpack-plugin');
const CssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
console.log(__dirname);
const CONFIG = {
	context: path.join(__dirname, 'src'),
	mode: DEV ? 'development' : 'production',
	target: 'web',
	parallelism: 1,
	profile: true,
	entry: {
		vendor: ['react', 'react-dom', 'react-router-dom'],
		app: ['./index.js'],
	},
	output: {
		path: DEV ? path.join(__dirname, 'public') : path.join(__dirname, 'build', APP_NAME),
		filename: DEV ? '[name].bundle.js' : '[name].[chunkhash].js',
		publicPath: DEV ? path.join(__dirname, 'public') : '//assets/' + APP_NAME + '/',
		pathinfo: DEV,
		chunkFilename: DEV ? '[name].bundle.js' : '[name].[chunkhash].js',
		chunkLoadingGlobal: 'webpackJsonp',
	},
	resolve: {
		extensions: ['*', '.js', '.css'],
	},
	performance: {
		maxEntrypointSize: 100000,
		maxAssetSize: 100000,
	},
	optimization: {
		minimizer: [
			/**
			 * Javascript minification plugin
			 * Source: https://github.com/webpack-contrib/uglifyjs-webpack-plugin
			 */
			new UglifyJsPlugin({
				parallel: true,
			}),
			/**
			 * A Webpack plugin to optimize \ minimize CSS assets.
			 * Source: https://github.com/NMFR/optimize-css-assets-webpack-plugin
			 */
			new OptimizeCssAssetsPlugin(),
		],
		splitChunks: {
			name: true,
			cacheGroups: {
				default: false,
				vendors: false,
				vendor: {
					chunks: 'all',
					name: 'vendor',
					test: 'vendor',
					enforce: true,
				},
			},
		},
	},
	stats: {
		colors: true,
		version: true,
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.css$/,
				use: [
					// Creates style nodes from JS strings
					'style-loader',
					// Translates CSS into CommonJS
					'css-loader',
				],
			},
			{
				test: /\.(png|jpg|jpeg|gif|svg)$/,
				use: [
					{
						loader: 'url-loader',
						options: {
							limit: 8192,
							fallback: 'file-loader',
							name: '[name]-[hash:8].[ext]',
						},
					},
				],
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.BUILD_TYPE': JSON.stringify(process.env.BUILD_TYPE),
			DEV: DEV,
			PROD: !DEV,
		}),
		new HtmlWebpackPlugin({
			template: '../assets/index.html',
		}),
	],
};
DEV && (CONFIG.devtool = 'cheap-module-eval-source-map');
module.exports = CONFIG;
