/* eslint-disable no-console */
import chalk from 'chalk';
import webpack from 'webpack';

import { generateHBS } from './make.hbs.js';

/**
 * Get Webpack configs
 */
import { hbsConfig } from '../webpack-configs/hbs.config.js';

import { makeConfig } from '../webpack-configs/webpack.config.js';

const CONFIGTYPE = {
	CLIENT: 'CLIENT',
	HBS: 'HBS',
	SERVER: 'SERVER',
};

const getWebpackConfig = (type) => {
	return type === CONFIGTYPE.CLIENT ? makeConfig() : hbsConfig();
};

const runWebpack = (type, hash) => {
	console.log(chalk.yellowBright('\n\n:: Webpack :: ', type));
	return new Promise(function (resolve, reject) {
		webpack(getWebpackConfig(type, hash), function (err, stats) {
			if (err) {
				console.error(chalk.red(err.stack || err));
				if (err.details) {
					console.error(chalk.red(err.details));
				}
				reject('Error while building webpack');
			}

			if (stats?.errors?.length || stats?.warnings?.length) {
				/* toJson() is expensive operation so moving under this condition when it is required */
				const info = stats.toJson();

				if (stats?.warnings?.length) {
					console.warn(chalk.yellow(info.warnings));
				}
				if (stats?.errors?.length) {
					console.error(chalk.red(info.errors));
					reject('Error while building webpack');
				}
			}

			console.log(
				stats?.toString({
					entrypoints: false,
					children: false,
					chunks: false,
					assets: type !== CONFIGTYPE.SERVER, // disabling assets primted only for server since they don't manifest in what goes to end users, hiding noise
					colors: true, // Shows colors in the console
				})
			);
			resolve();
		});
	});
};

const generate = async () => {
	console.log(':: RUN WEBPACK CONFIGURATION :: ');
	await runWebpack(CONFIGTYPE.HBS).catch();
	await runWebpack(CONFIGTYPE.CLIENT).catch();
	await generateHBS();
};

generate();
