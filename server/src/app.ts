import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
import serveStatic from 'serve-static';
import { createProxyMiddleware } from 'http-proxy-middleware';

import {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	fetchApiWorker,
	compiledTemplate,
	handleGraphql,
} from './middlewares';
import { constructReqDataObject, generateBuildTime } from './helper';
import { pathPublic, pathTemplate, pathRootDir } from './paths';
import { logger } from './Logger';

const app = express();

generateBuildTime();

app.use(cors());
app.use(cookieParser());
app.use(userAgentHandler);

// app.use(express.json()); // Parse JSON bodies
// app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

/*
app.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.url}`);
    next();
});
*/

app.get('/health', (req: Request, res: Response) => {
	logger.info('Health check endpoint hit');
	return res.status(200).json({ status: 'Server Running' });
});

// middlewares
app.get('/WebWorker.js', fetchWebWorker);
app.get('/apiWorker.js', fetchApiWorker);
app.get('/api/fetchWineData/*', getCSVData);
app.get('/images/*', fetchImage);
// app.use('/graphql/*', handleGraphql);
app.all('/graphql', handleGraphql);

app.use(
	'/proxy/okrcentral',
	createProxyMiddleware({
		target: 'https://okrcentral.github.io',
		changeOrigin: true,
		pathRewrite: {
			'^/proxy/okrcentral': '/sample-okrs/db.json', // rewrite path
		},
	}),
);

app.use('/login', (_, res: Response) => {
	res.send({
		token: 'test123',
	});
});

// Set hbs template config
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'handlebars');
app.set('views', pathTemplate);

const bundleConfig = ['en', 'vendor', 'app'].map((item) => `${pathPublic}/${item}.bundle.js`);

app.use(
	serveStatic(pathRootDir, {
		index: ['index.hbs', 'default.html', 'default.htm'],
	}),
);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	logger.error(err.stack);
	res.status(500).send('Something broke!');
});

app.all('*', (req: Request, res: Response) => {
	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		dev: true,
		layout: false,
	};
	res.send(compiledTemplate(data));
});

export { app };
