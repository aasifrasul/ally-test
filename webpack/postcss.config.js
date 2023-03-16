import postcssImport from 'postcss-import';
import postcssFor from 'postcss-for';
import postcssRandom from 'postcss-random';
import postcssNested from 'postcss-nested';
import postcssMixins from 'postcss-mixins';
import postcssSimpleVars from 'postcss-simple-vars';
import postcssCssnext from 'postcss-cssnext';

const plugins = [
	postcssImport({
		path: ['./styles'],
	}),
	postcssFor,
	postcssRandom,
	postcssNested,
	postcssMixins,
	postcssSimpleVars,
	postcssCssnext({
		browsers: [
			'Chrome > 27',
			'android >= 4.0',
			'iOS >= 4.1',
			'Firefox >= 31',
			'UCAndroid >= 9',
			'Edge >= 13',
			'ie_mob > 10',
		],
		url: false,
	}),
];

const postCSSConfig = {
	plugins,
};

export { postCSSConfig };
