const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const babelConfig = require('./babel.config');
const postCSSConfig = require('./postcss.config');
var PROD = process.env.NODE_ENV === 'production';
// const getDefaultLocalIdent = require('css-loader/lib/getLocalIdent.js');
const appName = process.env.APP_NAME;

var loaders = [
	{
		test: /\.(ts|tsx)$/,
		exclude: /node_modules/,
		use: [
			{
				loader: 'ts-loader',
				options: {},
			},
		],
	},
	{
		test: /\.(js|jsx)$/,
		use: {
			loader: 'babel-loader',
			options: babelConfig,
		},
		exclude: /node_modules/,
	},
	{
		test: /\.(gif|png|jpe?g|svg)$/i,
		exclude: /node_modules/,
		use: [
			{
				loader: 'file-loader',
				options: {},
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
					name: 'fonts/[name].[ext]',
					publicPath: PROD ? '/www/linchpin/' + appName : '/public',
				},
			},
		],
	},
];

if (PROD) {
	loaders.push({
		test: /.css$/,
		use: [
			MiniCssExtractPlugin.loader,
			{
				loader: 'css-loader',
				options: {
					modules: true,
					importLoaders: 1,
					localIdentName: '[sha512:hash:base64:6]',
				},
			},
			{
				loader: 'postcss-loader',
				options: {
					config: {
						path: __dirname,
					},
				},
			},
		],
	});
} else {
	loaders.push({
		test: /\.css$/i,
		use: [
			MiniCssExtractPlugin.loader,
			{
				loader: 'css-loader',
				options: {
					modules: {
						//localIdentName: '[path][name]__[local]--[hash:base64:5]',
						localIdentName: '[path][name]_[local]_[hash:base64:6]',
					},
					importLoaders: 1,
				},
			},
			{
				loader: 'postcss-loader',
				options: postCSSConfig,
			},
		],
	});
}

module.exports = loaders;
