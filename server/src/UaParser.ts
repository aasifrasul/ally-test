import parser from 'ua-parser-js';

export const parse = (userAgent: string) => {
	const uaParsedObj = parser(userAgent);
	return uaParsedObj;
};
