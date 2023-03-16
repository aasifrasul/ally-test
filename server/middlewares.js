import idx from 'idx';
import htmlEncode from 'htmlEncode';
import { isMobileApp } from './helper.js';
import { parse } from './UAParser.js';
import { fetchCSVasJSON } from './fetchCSVasJSON.js';

const csvData = fetchCSVasJSON('../../Downloads/winemag-data-130k-v2.csv');
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
		if (isMobileApp(req.userAgentData) === false) {
			const { source } = idx(req, (_) => _.userAgentData.userAgent) || {};
			req.fkUA = `${source || userAgent} FKUA/msite/0.0.1/msite/Mobile`;
		} else {
			req.fkUA = userAgent;
		}
	}
	next();
};

const getCSVData = (req, res) => {
	const pageNum = parseInt(req.params.pageNum, 10);
	const pageData = result.slice(pageNum * 10, (pageNum + 1) * 10);
	res.end(JSON.stringify(pageNum ? { pageData } : { headers, pageData }));
};

export { userAgentHandler, getCSVData };
