import cors from 'cors';
import express, {
	Application,
	Request as ExpressRequest,
	Response,
	NextFunction,
} from 'express';
import helmet from 'helmet';
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
import serveStatic from 'serve-static';
import bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';
const compression = require('compression');

import { host, port } from './envConfigDetails';
import {
	userAgentHandler,
	getCSVData,
	fetchImage,
	fetchWebWorker,
	compiledTemplate,
	handleGraphql,
} from './middlewares';
import { handleFileupload } from './fileUploads';
import { setupProxy } from './setupProxy';
import { constructReqDataObject, generateBuildTime } from './helper';
import { pathPublic, pathTemplate, pathRootDir } from './paths';
import { finalHandler, setupGlobalAsyncErrorHandling } from './globalErrorHandler';
import { logger } from './Logger';
import { csp } from './middlewares/csp';
import { constants } from '../../src/constants';
import { processMessage } from './messageProcessing';
import { runDialogFlow } from './utility/dialogFlow';

interface CustomError extends Error {
	status?: number;
}

interface Request extends ExpressRequest {
	timedout?: boolean;
	id?: string;
}

const app: Application = express();

generateBuildTime();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});

setupGlobalAsyncErrorHandling(app);
handleFileupload(app);

app.all('/graphql', handleGraphql);

setupProxy(app);
app.use(cookieParser());
app.use(userAgentHandler);
app.use(compression());
app.use(
	cors({
		origin:
			process.env.NODE_ENV === 'development'
				? `http://${host}:${port}`
				: process.env.ALLOWED_ORIGINS?.split(','),
		methods: ['GET', 'POST', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
);
// app.use(helmet(csp));
// Middleware for JSON
app.use(express.json({ limit: '10kb' }));

// Middleware for URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Middleware for plain text
app.use(bodyParser.text());

app.use(limiter);

// Timeout handling
const timeout = require('connect-timeout');
app.use(timeout('5s'));
app.use(haltOnTimedout);

function haltOnTimedout(req: Request, res: Response, next: NextFunction) {
	if (!req.timedout) next();
}

// Health check endpoint
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
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

// handles all the valid routes
app.all(['/', '/:route'], (req: Request, res: Response, next: NextFunction) => {
	const { route } = req.params;
	if (route && !constants.routes!.includes(route)) {
		next();
	}

	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		dev: true,
		layout: false,
	};
	res.send(compiledTemplate(data));
});

// 404 Handler
finalHandler(app);

export { app };
