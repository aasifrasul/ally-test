import { minify } from 'html-minifier';
import { getOptions } from 'loader-utils';

const options = getOptions(this);

const htmlminifier = (source) => {
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

export { htmlminifier };
