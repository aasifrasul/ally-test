/* eslint-disable no-console */
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import loaders from '../webpack/loaders.js';
import { pathRootDir, pathWebpack, pathWebpackConfigs, pathPublic } from '../server/paths.js';

import webpackCommonConfig from '../webpack/webpack.common.js';

var htmlminifier = path.join(pathWebpack, 'html-minifier-loader.js');

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

export const hbsConfig = () => {
	console.log('\n\nHBS:: Running as:', process.env.BUILD_TYPE || 'release');
	console.log('HBS:: ENVIRONMENTS');
	console.log('--------------------------------------------------');
	var outputPath = DEV ? 'public' : 'build';
	return {
		entry: path.join(pathWebpackConfigs, 'hbs.js'),
		output: {
			path: path.join(pathPublic, 'server'),
			filename: 'hbs.bundle.js',
			// libraryTarget: 'commonjs2',
			chunkLoadingGlobal: 'webpackJsonp',
			publicPath: pathPublic,
			pathinfo: DEV,
			globalObject: `typeof self !== 'undefined' ? self : this`,
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
									//localIdentName: '[path][name]__[local]--[hash:base64:5]',
									localIdentName: DEV
										? '[path][name]_[local]_[hash:base64:6]'
										: '[sha512:hash:base64:6]',
								},
								importLoaders: 1,
								minimize: !DEV,
							},
						},
						'postcss-loader',
					],
				}
			),
		},
	};
};
