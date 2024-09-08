import * as webpack from 'webpack';

declare module 'webpack.config.js' {
	const config: webpack.Configuration;
	export default config;
}
