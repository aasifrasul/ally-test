import path from 'path';
import handlebars from 'handlebars';
import { createHandler } from 'graphql-http/lib/use/http';
import { PubSub } from 'graphql-subscriptions';

import { isMobileApp, nocache, getParsedUserAgentData, getFileContents } from '../helper';
import { schema } from '../schema';
import { parse } from '../UaParser';
import { pathAssets, pathTemplate } from '../paths';
import { StreamCSVService } from '../utils/streamCSVService';

const pubsub = new PubSub();
const streamCSVService = new StreamCSVService();

handlebars.registerHelper({
	if_eq: (a: any, b: any, opts: any) => a === b && opts.fn({}),
});

const handler = createHandler({
	schema,
	context: () => ({ pubsub }),
});

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
export const userAgentHandler = (req: any, res: any, next: Function) => {
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

export const fetchWineData = async (req: any, res: any) => {
	try {
		const filePath = path.join(pathAssets, 'winemag-data-130k-v2.csv');
		const pageNum = parseInt(req.query.page || '0', 10);
		const pageSize = parseInt(req.query.pageSize || '10', 10);

		const [headers, pageData] = await Promise.all([
			streamCSVService.getHeaders(filePath),
			streamCSVService.getPageData(filePath, pageNum, pageSize),
		]);

		res.json(pageNum ? { pageData } : { headers, pageData });
	} catch (error) {
		console.error('Error fetching CSV data:', error);
		res.status(500).json({ error: 'Failed to fetch CSV data' });
	}
};

export const fetchImage = (req: any, res: any) => {
	const imagePath = path.join(pathAssets, 'images');
	const img = getFileContents(`${imagePath}/${req.params[0]}`);

	res.writeHead(200, { 'Content-Type': 'image/jpeg' });

	res.end(img, 'binary');
};

export const fetchWorker = (req: any, res: any, fileContent: string) => {
	res.set('Content-Type', 'application/javascript; charset=utf-8');
	nocache(res);
	res.end(fileContent);
};

export const handleGraphql = (req: any, res: any) => handler(req, res);
