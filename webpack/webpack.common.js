const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');
const PROD = process.env.NODE_ENV === 'production';
const PATHS = {
	src: path.join(__dirname, '..', 'src'),
	build: path.join(__dirname, '..', 'build'),
	public: path.join(__dirname, '..', 'public'),
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

module.exports = {
	getNodeEnv,
	getUglifyJs,
	getCompressionPlugin,
	cleanWebpackPlugin,
};
