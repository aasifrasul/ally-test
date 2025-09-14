const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
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

function getMinimizers() {
	return [
		new TerserPlugin({
			parallel: true,
			terserOptions: {
				format: { comments: false },
			},
			extractComments: false,
		}),
		new CssMinimizerPlugin(),
	];
}

function getCompressionPlugin() {
	return new CompressionPlugin({
		algorithm: 'gzip',
		test: /\.(js|css|svg)$/,
	});
}

function cleanWebpackPlugin() {
	return new CleanWebpackPlugin({
		verbose: true,
		cleanStaleWebpackAssets: false,
	});
}

module.exports = {
	PATHS,
	getNodeEnv,
	getMinimizers,
	getCompressionPlugin,
	cleanWebpackPlugin,
};
