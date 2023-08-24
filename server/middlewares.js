import React from 'react';
import ReactDOMServer from 'react-dom/server';

import idx from 'idx';
import path from 'path';
import handlebars from 'handlebars';
import { createHandler } from 'graphql-http/lib/use/http';

// import App from '../src/components/App/App.js';

import { isMobileApp, nocache, getParsedUserAgentData, getFileContents } from './helper.js';
import { schema } from './schema/schema.js';
import { parse } from './UaParser.js';
import { fetchCSVasJSON } from './fetchCSVasJSON.js';
import { pathRootDir, pathImage, pathTemplate } from './paths.js';

const csvData = fetchCSVasJSON(
	`${path.join(pathRootDir, 'assets')}/winemag-data-130k-v2.csv`
);
const { headers, result } = csvData;

//const app = ReactDOMServer.renderToString(React.createElement(App));

handlebars.registerHelper({
	if_eq: (a, b, opts) => a === b && opts.fn(Object.create(null)),
});

const handler = createHandler({ schema });

const webWorkerContent = getFileContents(`./src/utils/WebWorker.js`);
const apiWorkerContent = getFileContents(`./src/workers/apiWorker.js`);

// PreeCopile template
const templatePath = path.join(pathTemplate, 'index.hbs');
const templateContent = getFileContents(templatePath);
export const compiledTemplate = handlebars.compile(templateContent);

/**
 * Generate user agent object (platform, version, ...)
 * @param req
 * @param res
 * @param next
 */

export const userAgentHandler = (req, res, next) => {
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

export const getCSVData = (req, res) => {
	const pageNum = parseInt(req.query.page, 10);
	const pageData = result.slice(pageNum * 10, (pageNum + 1) * 10);
	res.end(JSON.stringify(pageNum ? { pageData } : { headers, pageData }));
};

export const fetchImage = (req, res) => {
	const img = getFileContents(`${pathImage}/${req.params[0]}`);

	// Set the response headers
	res.writeHead(200, { 'Content-Type': 'image/jpeg' });

	// Send the image data as the response body
	res.end(img, 'binary');
};

export const fetchWorker = (req, res, fileContent) => {
	res.set('Content-Type', `application/javascript; charset=utf-8`);
	nocache(res);
	res.end(fileContent);
};

export const fetchWebWorker = (req, res) => fetchWorker(req, res, webWorkerContent);

export const fetchApiWorker = (req, res) => fetchWorker(req, res, apiWorkerContent);

export const handleGraphql = (req, res) => handler(req, res);
