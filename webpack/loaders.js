const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const babelConfig = require('./babel.config');
var PROD = process.env.NODE_ENV === 'production';
const DEV = !PROD;
const appName = process.env.APP_NAME;

var loaders = [
	{
		test: /\.(ts|tsx)$/,
		exclude: /node_modules/,
		use: [
			{
				loader: 'ts-loader',
				options: {
					// Enable faster builds in development
					transpileOnly: DEV,
					// Enable HMR for TypeScript
					experimentalWatchApi: DEV,
				},
			},
		],
	},
	{
		test: /\.(js|jsx)$/,
		use: {
			loader: 'babel-loader',
			options: {
				...babelConfig,
				// Enable caching for faster HMR
				cacheDirectory: DEV,
			},
		},
		exclude: /node_modules/,
	},
	{
		test: /\.(gif|png|jpe?g|svg)$/i,
		exclude: /node_modules/,
		use: [
			{
				loader: 'file-loader',
				options: {
					// Use consistent naming for HMR
					name: DEV ? '[name].[ext]' : '[name].[contenthash].[ext]',
					outputPath: 'images/',
				},
			},
		],
		type: 'javascript/auto',
	},
	{
		test: /\.(eot|ttf|woff|woff2)$/,
		exclude: /node_modules/,
		use: [
			{
				loader: 'file-loader',
				options: {
					name: DEV ? 'fonts/[name].[ext]' : 'fonts/[name].[contenthash].[ext]',
					publicPath: PROD ? '/www/linchpin/' + appName : '/public',
				},
			},
		],
	},
];

// Enhanced CSS loader configuration for HMR
loaders.push(
	{
		test: /\.module\.css$/, // Explicitly target .module.css files
		use: [
			DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
			{
				loader: 'css-loader',
				options: {
					modules: {
						mode: 'local',
						localIdentName: DEV
							? '[name]__[local]--[hash:base64:5]'
							: '[hash:base64:6]',
						exportLocalsConvention: 'camelCase',
						// Add this to ensure proper export
						namedExport: false,
					},
					importLoaders: 1,
					sourceMap: DEV,
				},
			},
			{
				loader: 'postcss-loader',
				options: {
					postcssOptions: {
						config: path.resolve(__dirname, 'postcss.config.js'),
					},
					sourceMap: DEV,
				},
			},
		],
	},
	{
		test: /\.css$/,
		exclude: /\.module\.css$/, // Regular CSS files without modules
		use: [
			DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
			'css-loader',
			'postcss-loader',
		],
	},
);

module.exports = loaders;
