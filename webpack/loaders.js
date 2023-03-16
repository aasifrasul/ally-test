import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { config } from './babel.config.js';
import { postCSSConfig } from './postcss.config.js';
import getDefaultLocalIdent from 'css-loader/lib/getLocalIdent.js';

const PROD = process.env.NODE_ENV === 'production';
const appName = process.env.APP_NAME;

const loaders = [
	{
		test: /\.(ts|tsx)$/,
		use: [
			{
				loader: 'awesome-typescript-loader',
				options: {
					useBabel: true,
					useCache: true,
					configFileName: path.resolve('..', 'tsconfig.json'),
					reportFiles: ['../../../../src/**/*.{ts,tsx}'],
				},
			},
		],
	},
	{
		test: /\.(js|jsx)$/,
		use: {
			loader: 'babel-loader',
			options: config,
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
				query: {
					modules: true,
					importLoaders: 1,
					localIdentName: '[sha512:hash:base64:6]',
				},
			},
			{
				loader: 'postcss-loader',
				options: {
					config: {
						path: path.resolve(''),
					},
				},
			},
		],
	});
} else {
	loaders.push({
		test: /.css$/,
		use: [
			{
				loader: 'style-loader',
				query: {
					singleton: true,
				},
			},
			{
				loader: 'css-loader',
				query: {
					modules: true,
					localIdentName: '[path][name]_[local]_[hash:base64:6]',
					getLocalIdent: getDefaultLocalIdent,
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

export { loaders };
