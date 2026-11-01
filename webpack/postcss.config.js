const postcssImport = require('postcss-import');
const postcssPresetEnv = require('postcss-preset-env');

const importPlugin = typeof postcssImport === 'function' ? postcssImport : postcssImport.default;
const presetEnvPlugin =
	typeof postcssPresetEnv === 'function' ? postcssPresetEnv : postcssPresetEnv.default;

module.exports = {
	postcssOptions: {
		plugins: [
			importPlugin({
				path: [__dirname, './styles'],
			}),
			presetEnvPlugin({
				stage: 2,
				browsers: ['Chrome > 100', 'Edge >= 130'],
				features: {
					'nesting-rules': true,
				},
				enableClientSidePolyfills: false,
				preserve: false,
				url: false,
			}),
		],
	},
};
