 
const path = require('path');
const loaders = require('../webpack/loaders');
const { publicPath } = require('../webpack/constants');
const htmlminifier = path.join(__dirname, '..', 'webpack', 'html-minifier-loader.js');
const webpackCommonConfig = require('../webpack/webpack.common');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const DEV = process.env.NODE_ENV !== 'production';

module.exports = function (env) {
	console.log('\n\nHBS:: Running as:', process.env.BUILD_TYPE || 'release');
	console.log('HBS:: ENVIRONMENTS');
	console.log('--------------------------------------------------');
	const outputPath = DEV ? 'public' : 'build';
	return {
		entry: __dirname + '/hbs.js',
		output: {
			path: path.join(__dirname, '..', outputPath, 'server', 'src'),
			filename: 'hbs.bundle.js',
			libraryTarget: 'commonjs2',
			chunkLoadingGlobal: 'webpackJsonp',
			publicPath,
		},
		mode: webpackCommonConfig.getNodeEnv(),
		plugins: [
			webpackCommonConfig.cleanWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: '[name].[contenthash:20].css',
				chunkFilename: '[name].[contenthash:20].css',
			}),
		],
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
							options: {
								removeComments: true,
								collapseWhitespace: true,
								preserveLineBreaks: false,
								minifyJS: {
									mangle: false,
									compress: false,
								},
							},
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
								modules: {
									mode: 'local',
									localIdentName: DEV
										? '[path][name]_[local]_[hash:base64:6]'
										: '[hash:base64:6]',
									exportLocalsConvention: 'camelCase', // Add this
								},
								importLoaders: 1,
								minimize: !DEV,
							},
						},
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									config: path.resolve(__dirname, 'postcss.config.js'),
								},
							},
						},
					],
				},
			),
		},
	};
};
