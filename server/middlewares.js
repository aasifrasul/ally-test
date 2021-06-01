const idx = require('idx');

const AppHelper = require('./helper');
const htmlEncode = require('htmlencode');
const { parse } = require('./UAParser');
const { fetchCSVasJSON } = require('./fetchCSVasJSON');

const csvData = fetchCSVasJSON('../../Downloads/winemag-data_first150k3ed116a.csv');
const { headers, result } = csvData;

/**
 * Generate user agent object (platform, version, ...)
 * @param req
 * @param res
 * @param next
 */

const userAgentHandler = (req, res, next) => {
	const { headers } = req;
	let userAgent =
		headers['X-User-Agent'] || headers['x-user-agent'] || headers['X-user-agent'] || headers['user-agent'];

	if (userAgent) {
		userAgent = htmlEncode.XSSEncode(userAgent);
		req.userAgentData = parse(userAgent);

		// Msite requires a custom string to be appended with usual user agent
		if (AppHelper.isMobileApp(req.userAgentData) === false) {
			const { source } = idx(req, (_) => _.userAgentData.userAgent) || {};
			req.fkUA = `${source || userAgent} FKUA/msite/0.0.1/msite/Mobile`;
		} else {
			req.fkUA = userAgent;
		}
	}
	next();
};

const getCSVData = (req, res, next) => {
	const { url } = req;
	if (url.includes('api/fetchWineData')) {
		const params = url.split('/');
		const pageNum = parseInt(params[3], 10);
		const pageData = result.slice(pageNum * 10, (pageNum + 1) * 10);
		res.end(JSON.stringify(pageNum ? { pageData } : { headers, pageData }));
	} else {
		next();
	}
};

module.exports = {
	userAgentHandler,
	getCSVData,
};
