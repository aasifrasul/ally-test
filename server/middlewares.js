const idx = require('idx');
const path = require('path');
const handlebars = require('handlebars');
const { createHandler } = require('graphql-http/lib/use/http');

const { isMobileApp, nocache, getParsedUserAgentData, getFileContents } = require('./helper');
const { schema } = require('./schema/schema');
const { parse } = require('./UAParser');
const { fetchCSVasJSON } = require('./fetchCSVasJSON');

const csvData = fetchCSVasJSON('../../Downloads/winemag-data-130k-v2.csv');
const { headers, result } = csvData;

handlebars.registerHelper({
	if_eq: (a, b, opts) => a === b && opts.fn(Object.create(null)),
});

const handler = createHandler({ schema });

const webWorkerContent = getFileContents(`./src/utils/WebWorker.js`);
const apiWorkerContent = getFileContents(`./src/workers/apiWorker.js`);

// PreeCopile template
const templatePath = path.join(__dirname, '..', 'Public', 'ally-test');
const templateContent = getFileContents(`${templatePath}/next1-ally-test.hbs`);
const compiledTemplate = handlebars.compile(templateContent);

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
		req.userAgentData = parse(getParsedUserAgentData(userAgent));

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
	const img = getFileContents(`${imagePath}/${req.params[0]}`);

	// Set the response headers
	res.writeHead(200, { 'Content-Type': 'image/jpeg' });

	// Send the image data as the response body
	res.end(img, 'binary');
};

const fetchWorker = (req, res, fileContent) => {
	res.set('Content-Type', `application/javascript; charset=utf-8`);
	nocache(res);
	res.end(fileContent);
};

const fetchWebWorker = (req, res) => fetchWorker(req, res, webWorkerContent);

const fetchApiWorker = (req, res) => fetchWorker(req, res, apiWorkerContent);

const handleGraphql = (req, res) => {
	handler(req, res);
};

module.exports = {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
	compiledTemplate,
	handleGraphql,
};
