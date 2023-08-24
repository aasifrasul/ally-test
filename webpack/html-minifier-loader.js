import { minify } from 'html-minifier';
import loaderUtils from 'loader-utils';

const options = loaderUtils.getOptions(this);

export default function (source) {
	this.cacheable && this.cacheable();
	var callback = this.async(),
		defaultOptions = {
			removeComments: true,
			collapseWhitespace: true,
		};

	if (options) {
		for (var k in defaultOptions) {
			if (options[k] == null) {
				options[k] = defaultOptions[k];
			}
		}
	}

	callback(null, minify(source, options || defaultOptions));
};
