const { minify } = require('html-minifier');
const loaderUtils = require('loader-utils');
const options = loaderUtils.getOptions(this);

module.exports = function (source) {
	this.cacheable && this.cacheable();
	const callback = this.async();
	const defaultOptions = {
		removeComments: true,
		collapseWhitespace: true,
	};

	if (options) {
		for (const k in defaultOptions) {
			if (options[k] == null) {
				options[k] = defaultOptions[k];
			}
		}
	}

	callback(null, minify(source, options || defaultOptions));
};
