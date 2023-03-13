/* eslint-disable no-console */
var path = require('path');
var loaders = require('../webpack/loaders');
var publicPath = require('../webpack/constants').publicPath;
var htmlminifier = path.join(__dirname, '..', 'webpack', 'html-minifier-loader.js');
var webpackCommonConfig = require('../webpack/webpack.common');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var DEV = process.env.NODE_ENV !== 'production';

var htmlminifierQuery = JSON.stringify({
	removeComments: true,
	collapseWhitespace: true,
	preserveLineBreaks: false,
	minifyJS: {
		mangle: false,
		compress: false,
	},
});

module.exports = function (env) {
	console.log('\n\nHBS:: Running as:', process.env.BUILD_TYPE || 'release');
	console.log('HBS:: ENVIRONMENTS');
	console.log('--------------------------------------------------');
	var outputPath = DEV ? 'public' : 'build';
	return {
		entry: __dirname + '/hbs.js',
		output: {
			path: path.join(__dirname, '..', outputPath, 'server'),
			filename: 'hbs.bundle.js',
			libraryTarget: 'commonjs2',
			jsonpFunction: 'webpackJsonp',
			publicPath: publicPath,
		},
		mode: webpackCommonConfig.getNodeEnv(),
		plugins: [webpackCommonConfig.cleanWebpackPlugin()],
		// resolve: resolve,
		optimization: {
			minimize: false,
		},
		module: {
			rules: loaders.concat(
				{
					test: /\.hbs$/,
					use: [
						{
							loader: 'handlebars-loader',
						},
						{
							loader: htmlminifier,
							query: htmlminifierQuery,
						},
					],
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								localIdentName: DEV ? '[path][name]_[local]_[hash:base64:6]' : '[sha512:hash:base64:6]',
								modules: true,
								importLoaders: 1,
								minimize: !DEV,
							},
						},
						{
							loader: 'postcss-loader',
						},
					],
				},
			),
		},
	};
};
