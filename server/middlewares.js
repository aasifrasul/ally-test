const idx = require('idx');
const path = require('path');
const fs = require('fs');

const { isMobileApp, nocache } = require('./helper');
const htmlEncode = require('htmlencode');
const { parse } = require('./UAParser');
const { fetchCSVasJSON } = require('./fetchCSVasJSON');

const csvData = fetchCSVasJSON('../../Downloads/winemag-data-130k-v2.csv');
const { headers, result } = csvData;

const enc = {
	encoding: 'utf-8',
};

const webWorkerContent = fs.readFileSync(`./src/utils/WebWorker.js`, enc);
const apiWorkerContent = fs.readFileSync(`./src/workers/apiWorker.js`, enc);

/**
 * Generate user agent object (platform, version, ...)
 * @param req
 * @param res
 * @param next
 */

const userAgentHandler = (req, res, next) => {
	const { headers } = req;
	let userAgent =
		headers['X-User-Agent'] ||
		headers['x-user-agent'] ||
		headers['X-user-agent'] ||
		headers['user-agent'];

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
	const pageNum = parseInt(req.query.page, 10);
	const pageData = result.slice(pageNum * 10, (pageNum + 1) * 10);
	res.end(JSON.stringify(pageNum ? { pageData } : { headers, pageData }));
};

const fetchImage = (req, res) => {
	const imagePath = path.join(__dirname, '..', 'assets', 'images');
	const img = fs.readFileSync(`${imagePath}/${req.params[0]}`);

	// Set the response headers
	res.writeHead(200, { 'Content-Type': 'image/jpeg' });

	// Send the image data as the response body
	res.end(img, 'binary');
};

const fetchWebWorker = (req, res) => {
	res.set('Content-Type', `application/javascript; charset=${enc.encoding}`);
	nocache(res);
	res.end(webWorkerContent);
};

const fetchApiWorker = (req, res) => {
	res.set('Content-Type', `application/javascript; charset=${enc.encoding}`);
	nocache(res);
	res.end(apiWorkerContent);
};

module.exports = {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
};
