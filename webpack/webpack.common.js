import path from 'path';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';

const PROD = process.env.NODE_ENV === 'production';
const PATHS = {
	src: path.resolve('..', 'src'),
	build: path.resolve('..', 'build'),
	public: path.resolve('..', 'public'),
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
	return new CleanWebpackPlugin([PATHS.build, PATHS.public], {
		allowExternal: true,
	});
}

export { getNodeEnv, getUglifyJs, getCompressionPlugin, cleanWebpackPlugin };
