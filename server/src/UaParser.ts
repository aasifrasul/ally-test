import { UAParser } from 'ua-parser-js';

export const parse = (userAgent: string) => {
	const uaParsedObj = UAParser(userAgent);
	return uaParsedObj;
};
