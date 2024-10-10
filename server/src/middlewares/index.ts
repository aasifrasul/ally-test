import path from 'path';
import handlebars from 'handlebars';
import { createHandler } from 'graphql-http/lib/use/http';
import { PubSub } from 'graphql-subscriptions';

import { isMobileApp, nocache, getParsedUserAgentData, getFileContents } from '../helper';
import { schema } from '../schema';
import { parse } from '../UaParser';
import { fetchCSVasJSON } from '../fetchCSVasJSON';
import { pathAssets, pathTemplate } from '../paths';

const { headers, result } = fetchCSVasJSON(path.join(pathAssets, 'winemag-data-130k-v2.csv'));

const pubsub = new PubSub();

handlebars.registerHelper({
	if_eq: (a: any, b: any, opts: any) => a === b && opts.fn({}),
});

const handler = createHandler({
	schema,
	context: () => ({ pubsub }),
});

const webWorkerContent = getFileContents(`./src/utils/WebWorker.js`);
const apiWorkerContent = getFileContents(`./src/workers/apiWorker.js`);

// PreeCopile template
const templatePath = path.join(pathTemplate, 'index.hbs');
const templateContent = getFileContents(templatePath);
const compiledTemplate = handlebars.compile(templateContent);

/**
 * Generate user agent object (platform, version, ...)
 * @param req
 * @param res
 * @param next
 */
const userAgentHandler = (req: any, res: any, next: Function) => {
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
			const { source } = req.userAgentData?.userAgent || {};
			req.fkUA = `${source || userAgent} FKUA/msite/0.0.1/msite/Mobile`;
		} else {
			req.fkUA = userAgent;
		}
	}

	next();
};

const getCSVData = (req: any, res: any) => {
	const pageNum = parseInt(req.query.page || '0', 10);
	const pageData = result.slice(pageNum * 10, (pageNum + 1) * 10);
	res.end(JSON.stringify(pageNum ? { pageData } : { headers, pageData }));
};

const fetchImage = (req: any, res: any) => {
	const imagePath = path.join(pathAssets, 'images');
	const img = getFileContents(`${imagePath}/${req.params[0]}`);

	res.writeHead(200, { 'Content-Type': 'image/jpeg' });

	res.end(img, 'binary');
};

const fetchWorker = (req: any, res: any, fileContent: string) => {
	res.set('Content-Type', 'application/javascript; charset=utf-8');
	nocache(res);
	res.end(fileContent);
};

const fetchWebWorker = (req: any, res: any) => fetchWorker(req, res, webWorkerContent);
const fetchApiWorker = (req: any, res: any) => fetchWorker(req, res, apiWorkerContent);

const handleGraphql = (req: any, res: any) => handler(req, res);

export {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
	compiledTemplate,
	handleGraphql,
};
