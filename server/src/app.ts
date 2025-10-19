import cors from 'cors';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { engine } from 'express-handlebars';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';
import compression from 'compression';
import { v4 as uuidv4 } from 'uuid';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const timeout = require('connect-timeout');

import { host, port, isCurrentEnvProd, ALLOWED_ORIGINS } from './envConfigDetails';
import {
	userAgentHandler,
	fetchWineData,
	fetchImage,
	compiledTemplate,
	handleGraphql,
} from './middlewares';
import { handleFileupload } from './fileUploads';
import { setupProxy } from './setupProxy';
import { constructReqDataObject, generateBuildTime } from './helper';
import { pathTemplate, pathRootDir, pathDist } from './paths';
import { finalHandler } from './globalErrorHandler';
import { constants } from '../../src/constants';

// Import auth components
import { authRoutes } from './routes/authRoutes';
import { optionalAuth } from './middlewares/authMiddleware';

import { logger } from './Logger';

interface RequestWithId extends Request {
	id?: string;
}

interface RequestWithTimedout extends Request {
	timedout: boolean;
}

const app: Application = express();

generateBuildTime();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // limit each IP to 100 requests per windowMs
});

// Setup file upload and proxy early
handleFileupload(app);
setupProxy(app);
app.all('/graphql', handleGraphql);

function haltOnTimedout(req: RequestWithTimedout, res: Response, next: NextFunction): void {
	if (!req.timedout) {
		next();
	} else {
		res.status(408).json({ error: 'Request timeout' });
	}
}

// 1. Global middlewares first
app.use(cookieParser());
app.use(userAgentHandler);
app.use(compression());
app.use(
	cors({
		origin: isCurrentEnvProd ? ALLOWED_ORIGINS?.split(',') : `http://${host}:${port}`,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
	}),
);

app.use(
	helmet({
		contentSecurityPolicy: isCurrentEnvProd ? undefined : false,
	}),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(bodyParser.text());
app.use(timeout('10s'));
app.use(haltOnTimedout as express.RequestHandler);
app.use(limiter);

// 2. Request ID middleware
app.use((req: RequestWithId, _, next: NextFunction) => {
	req.id = uuidv4();
	next();
});

// 3. Optional auth middleware (before routes that might need it)
app.use(optionalAuth);

// 4. WEBPACK DEV MIDDLEWARE SETUP (BEFORE OTHER STATIC ROUTES)
if (!isCurrentEnvProd) {
	// Import your webpack configuration
	const webpackConfig = require('../../webpack-configs/webpack.config');

	// Create webpack compiler
	const compiler = webpack(webpackConfig) as any;

	// Add webpack-dev-middleware FIRST
	app.use(
		webpackDevMiddleware(compiler, {
			publicPath: webpackConfig.output.publicPath, // This should be '/public/'
			stats: {
				colors: true,
				hash: false,
				timings: true,
				chunks: false,
				chunkModules: false,
				modules: false,
			},
			writeToDisk: false,
			// Ensure it handles all requests under /public/
			index: false, // Don't serve index files
		}),
	);

	// Add webpack-hot-middleware for HMR
	app.use(
		webpackHotMiddleware(compiler, {
			log: console.log,
			path: '/__webpack_hmr',
			heartbeat: 10 * 1000,
		}),
	);

	logger.info('🔥 Hot Module Replacement enabled');
}

// 5. Specific API routes (before static files)
app.get('/health', async (_, res: Response) => {
	res.status(200).json({ status: 'healthy' });
});

// Auth routes
app.use('/auth', authRoutes);

// API routes
app.get('/api/fetchWineData/', fetchWineData);

// Image serving
app.get('/images/', fetchImage);

// Redirects
app.use('/login', (_, res: Response) => {
	res.redirect('/auth/login');
});

// 6. STATIC FILE SERVING (after webpack middleware)
if (isCurrentEnvProd) {
	// Production: serve built files
	app.use('/public', express.static(pathDist));
	// Serve other static assets from root
	app.use(express.static(pathRootDir, { index: false }));
} else {
	// Development:
	// Webpack-dev-middleware already handles /public/ paths
	// Only serve non-webpack static assets from root
	app.use(
		express.static(pathRootDir, {
			index: false,
			// Exclude paths that webpack handles
			setHeaders: (res, path) => {
				if (path.includes('/public/')) {
					// Let webpack-dev-middleware handle these
					return false;
				}
			},
		}),
	);
}

// Set hbs template config
app.engine('.hbs', engine({ extname: '.hbs' }));
app.set('view engine', 'handlebars');
app.set('views', pathTemplate);

// Bundle config for templates
const bundleConfig = isCurrentEnvProd
	? ['en', 'vendor', 'app'].map((item) => `/public/${item}.[chunkhash].js`) // Production uses chunkhash
	: ['en', 'vendor', 'app'].map((item) => `/public/${item}.bundle.js`); // Dev uses .bundle.js

// 7. Dynamic template routes
app.all(['/', '/:route'], (req: any, res: Response, next: NextFunction) => {
	const { route } = req.params;
	if (route && !constants.routes!.includes(route)) {
		return next();
	}

	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		user: req.user,
		dev: !isCurrentEnvProd,
		layout: false,
	};
	res.send(compiledTemplate(data));
});

// 8. 404 Handler last
finalHandler(app);

export { app };
