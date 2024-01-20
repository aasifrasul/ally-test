const parser = require('ua-parser-js');

const parse = (userAgent) => {
	const uaParsedObj = parser(userAgent);
	return uaParsedObj;
};

module.exports = {
	parse,
};
