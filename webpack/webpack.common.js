import UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';

import { pathSource, pathBuild, pathPublic } from '../server/paths.js';

const PROD = process.env.NODE_ENV === 'production';

const PATHS = {
	src: pathSource,
	build: pathBuild,
	public: pathPublic,
};

function getNodeEnv() {
	return PROD ? 'production' : 'development';
}

function getUglifyJs() {
	return new UglifyJSPlugin({
		sourceMap: true,
		uglifyOptions: {
			warnings: false,
			cache: true,
			parallel: true,
			output: {
				comments: false,
			},
		},
	});
}

function getCompressionPlugin() {
	return new CompressionPlugin({
		asset: '[path][query]',
		algorithm: 'gzip',
		test: /\.js$|\.css$|\.svg$/,
	});
}

function cleanWebpackPlugin() {
	return new CleanWebpackPlugin({
		dry: true,
		verbose: true,
		cleanStaleWebpackAssets: false,
		protectWebpackAssets: false,
	});
}

export default {
	getNodeEnv,
	getUglifyJs,
	getCompressionPlugin,
	cleanWebpackPlugin,
};
