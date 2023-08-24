import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import babelConfig from './babel.config.js';
import postCSSConfig from './postcss.config.js';

import { pathTSConfig, pathSource } from '../server/paths.js';

var PROD = process.env.NODE_ENV === 'production';
// const getDefaultLocalIdent = require('css-loader/lib/getLocalIdent.js');
const appName = process.env.APP_NAME;

var loaders = [
	{
		test: /\.(ts|tsx)$/,
		use: [
			{
				loader: 'awesome-typescript-loader',
				options: {
					useBabel: true,
					useCache: true,
					configFileName: pathTSConfig,
					reportFiles: ['../../../../src/**/*.{ts,tsx}'],
				},
			},
		],
	},
	{
		test: /\.(js|jsx)$/,
		use: {
			loader: 'babel-loader',
			options: babelConfig,
		},
		exclude:
			/node_modules(?!(\/@fpg-modules[/]fk-cp-utils|\/fk-cp-shared|\/@fpg-modules[/]fk-ui-common|\/@fpg-modules|\/rv-*|\/@flipkart\/rv-overlay-otp))/,
	},
	{
		test: /\.(gif|png|jpe?g|svg)$/i,
		use: [
			{
				loader: 'image-size-loader',
				options: {
					bypassOnDebug: true, // webpack@1.x
					options: {
						name: '[name]-[hash:8].[ext]',
					},
					disable: true, // webpack@2.x and newer
				},
			},
		],
		type: 'javascript/auto',
	},
	{
		test: /\.(eot|ttf|woff|woff2)$/,
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
						path: pathSource,
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
				loader: 'style-loader',
				options: {},
			},
			{
				loader: 'postcss-loader',
				options: postCSSConfig,
			},
		],
	});
}

export default loaders;
