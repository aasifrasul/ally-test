/* eslint-disable no-console */
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

import { loaders } from '../webpack/loaders.js';
import { publicPath } from '../webpack/constants.js';
import { htmlminifier } from '../webpack/html-minifier-loader.js';
import { getNodeEnv, cleanWebpackPlugin } from '../webpack/webpack.common.js';

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

const hbsConfig = (env) => {
	console.log('\n\nHBS:: Running as:', process.env.BUILD_TYPE || 'release');
	console.log('HBS:: ENVIRONMENTS');
	console.log('--------------------------------------------------');
	var outputPath = DEV ? 'public' : 'build';
	return {
		entry: '/hbs.js',
		output: {
			path: path.resolve('..', outputPath, 'server'),
			filename: 'hbs.bundle.js',
			libraryTarget: 'jsonp',
			jsonpFunction: 'webpackJsonp',
			publicPath,
		},
		mode: getNodeEnv(),
		plugins: [cleanWebpackPlugin()],
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

export { hbsConfig };
