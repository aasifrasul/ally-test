const path = require('path');
const { RawSource } = require('webpack-sources');
const Constants = require('./constants');

class EmitAssetsPlugin {
	constructor(options) {
		this.options = options;
	}

	apply(compiler) {
		compiler.hooks.thisCompilation.tap('EmitAssetsPlugin', (compilation) => {
			compilation.hooks.processAssets.tap(
				{
					name: 'EmitAssetsPlugin',
					stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
				},
				(assets) => {
					const output = {
						js: [],
						css: [],
						img: [],
						json: [],
						chunks: {},
						preload: this.options.preloadConfig,
						sentryKey: '',
						sentryRelease: '',
						sentryURL: '',
						localeChunks: {},
					};

					const publicPath = this.options.appendPublicPath
						? compilation.options.output.publicPath
						: Constants.publicPath;

					// Important: Ordering is crucial here, the <script> tags are added in this same order.
					const entries = ['runtime', 'common', 'vendor', 'app'];

					/**
					 * Build a list of all JS and CSS assets.
					 * Assets which need to be loaded with the initial page load are kept separate from
					 * assets belonging to other chunks.
					 */
					compilation?.namedChunks?.forEach((item) => {
						const name = item.name;
						if (entries.find((entry) => name.includes(entry))) {
							item.files.forEach((file) => {
								const extension = path.extname(file);
								const fileUrl = `${publicPath}${file}`;
								switch (extension) {
									case '.js':
										output.js.push(fileUrl);
										break;
									case '.css':
										output.css.push(fileUrl);
										break;
								}
							});
						} else {
							output.chunks[name] = {
								js: [],
								css: [],
							};
							output.localeChunks[name] = [];
							item.files.forEach((file) => {
								const extension = path.extname(file);
								const fileUrl = `${publicPath}${file}`;

								switch (extension) {
									case '.js':
										output.chunks[name]['js'].push(fileUrl);
										output.localeChunks[name].push(fileUrl);
										break;
									case '.css':
										output.chunks[name]['css'].push(fileUrl);
										break;
								}
							});
						}
					});

					let orderedBundles = [];
					entries?.forEach((entryName) => {
						output.js.forEach((rawOutput) => {
							const filename = rawOutput.split('/').pop();
							const outputName = filename.split('.').shift();

							if (entryName === outputName) {
								orderedBundles.push(rawOutput);
							}
						});
					});
					output.js = orderedBundles;

					/**
					 * Build a list of all other assets
					 */
					Object.keys(assets).forEach((fileName) => {
						const extension = path.extname(fileName);
						const fileUrl = `${publicPath}${fileName}`;
						switch (extension) {
							case '.json':
								output.json.push(fileUrl);
								break;
							case '.gif':
							case '.jpg':
							case '.png':
							case '.svg':
							case '.jpeg':
							case '.webp':
								output.img.push(fileUrl);
								break;
						}
					});

					output.sentryKey = Constants.SENTRY_KEY;
					output.sentryRelease = Constants.SENTRY_VERSION;
					output.sentryURL = Constants.SENTRY_URL;

					/**
					 * Emit the list of assets as a file
					 */
					compilation.emitAsset(
						this.options.fileName,
						new RawSource(JSON.stringify(output)),
					);

					/**
					 * Emit the generated list to console, for developer convenience while reviewing Jenkins logs
					 * console.log('EmitAssetsPlugin :: Start output');
					 * console.log(output);
					 * console.log('EmitAssetsPlugin :: End output');
					 */
				},
			);
		});
	}
}

module.exports = EmitAssetsPlugin;
