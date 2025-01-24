import cors from 'cors';
import bodyParser from 'body-parser';
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
	compiledTemplate,
	handleGraphql,
} from './middlewares';
import { constructReqDataObject, generateBuildTime } from './helper';
import { pathPublic, pathTemplate, pathRootDir } from './paths';
import { logger } from './Logger';
import { processMessage } from './messageProcessing';
import { runDialogFlow } from './utility/dialogFlow';

const app = express();

generateBuildTime();

// Conditional middleware function
const conditionalBodyParser = (req: Request, res: Response, next: NextFunction): void => {
	if (req.path === '/graphql') {
		// Skip body-parser for GraphQL requests
		next();
		return;
	}
	// Apply body-parser for non-GraphQL requests
	return bodyParser.json()(req, res, next);
};

app.use(cors());

app.all('/graphql', handleGraphql);

//app.use(bodyParser.json());

app.use(cookieParser());
app.use(userAgentHandler);

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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

/*
app.post('/api/chat', async (req, res) => {
	const userMessage = req.body.message;
	try {
		const botResponse = await runDialogFlow(userMessage);
		res.json({ message: botResponse });
	} catch (error) {
		logger.error('Error:', error);
		res.status(500).json({ message: 'An error occurred while processing your message.' });
	}
});
*/

// middlewares
app.get('/WebWorker.js', fetchWebWorker);
app.get('/api/fetchWineData/*', getCSVData);
app.get('/images/*', fetchImage);

app.use(
	'/proxy/okrcentral',
	createProxyMiddleware({
		target: 'https://okrcentral.github.io',
		changeOrigin: true,
		pathRewrite: {
			'^/proxy/okrcentral': '', // remove the entire path
		},
		router: {
			'/proxy/okrcentral': 'https://okrcentral.github.io/sample-okrs/db.json',
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
