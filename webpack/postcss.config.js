module.exports = {
	postcssOptions: {
		plugins: [
			require('postcss-import')({
				path: [__dirname, './styles'],
			}),
			require('postcss-for'),
			require('postcss-random'),
			require('postcss-nested'),
			require('postcss-mixins'),
			require('postcss-simple-vars'),
			require('postcss-cssnext')({
				browsers: ['Chrome > 100', 'Edge >= 130'],
				url: false,
			}),
		],
	},
};
