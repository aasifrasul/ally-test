import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const timeout = require('connect-timeout');

import { host, port, isProdEnv, ALLOWED_ORIGINS } from '../envConfigDetails';
import { handleGraphql, userAgentHandler } from '../middlewares';
import { handleFileupload } from '../fileUploads';
import { setupProxy } from '../setupProxy';
import { logger } from '../Logger';
import { optionalAuth } from '../middlewares/authMiddleware';

interface RequestWithId extends Request {
	id?: string;
}

interface RequestWithTimedout extends Request {
	timedout: boolean;
}

export interface GlobalMiddlewareDependencies {
	app?: Application;
	host?: string;
	port?: number | string;
	isProdEnv?: boolean;
	ALLOWED_ORIGINS?: string;
	logger?: Pick<typeof logger, 'info'>;
	webpackFactory?: typeof webpack;
	loadWebpackConfig?: () => any;
	rateLimitFactory?: typeof rateLimit;
	timeoutFactory?: (ms: string) => any;
}

export function createGlobalMiddleware(
	dependencies: GlobalMiddlewareDependencies = {},
): (app: Application) => void {
	const resolvedApp = dependencies.app;
	const resolvedHost = dependencies.host ?? host;
	const resolvedPort = dependencies.port ?? port;
	const resolvedIsProdEnv = dependencies.isProdEnv ?? isProdEnv;
	const resolvedAllowedOrigins = dependencies.ALLOWED_ORIGINS ?? ALLOWED_ORIGINS;
	const runtimeLogger = dependencies.logger ?? logger;
	const webpackFactory = dependencies.webpackFactory ?? webpack;
	const loadWebpackConfig =
		dependencies.loadWebpackConfig ??
		(() => require('../../../webpack-configs/webpack.config.js'));
	const rateLimitFactory = dependencies.rateLimitFactory ?? rateLimit;
	const timeoutFactory = dependencies.timeoutFactory ?? timeout;

	return (app: Application = resolvedApp ?? ({} as Application)): void => {
		const globalLimiter = rateLimitFactory({
			windowMs: 15 * 60 * 1000,
			max: 100,
			standardHeaders: true,
			legacyHeaders: false,
		});

		app.use(globalLimiter);
		handleFileupload(app);
		setupProxy(app);
		app.all('/graphql', handleGraphql);

		app.use(cookieParser());
		app.use(userAgentHandler);
		app.use(compression());
		app.use(
			cors({
				origin: resolvedIsProdEnv
					? resolvedAllowedOrigins?.split(',')
					: [
							`http://${resolvedHost}:${resolvedPort}`,
							`http://localhost:${resolvedPort}`,
							`http://127.0.0.1:${resolvedPort}`,
						],
				methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
				allowedHeaders: ['Content-Type', 'Authorization'],
				credentials: true,
			}),
		);

		app.use(
			helmet({
				contentSecurityPolicy: resolvedIsProdEnv ? undefined : false,
			}),
		);

		app.use(express.json({ limit: '1mb' }));
		app.use(express.urlencoded({ extended: true, limit: '100kb' }));
		app.use(bodyParser.text());
		app.use(timeoutFactory('30s'));
		app.use(haltOnTimedout as express.RequestHandler);
		app.use((req: RequestWithId, _: unknown, next: NextFunction) => {
			req.id = uuidv4();
			next();
		});
		app.use(optionalAuth);

		if (!resolvedIsProdEnv) {
			app.use('/public', (req, res, next) => {
				if (req.path && req.path.endsWith('.ts')) {
					res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
				}
				next();
			});

			const webpackConfig = loadWebpackConfig();
			const compiler = webpackFactory(webpackConfig) as any;

			app.use(
				webpackDevMiddleware(compiler, {
					publicPath: webpackConfig.output.publicPath,
					stats: {
						colors: true,
						hash: false,
						timings: true,
						chunks: false,
						chunkModules: false,
						modules: false,
					},
					writeToDisk: false,
					index: false,
				}),
			);

			app.use(
				webpackHotMiddleware(compiler, {
					log: console.log,
					path: '/__webpack_hmr',
					heartbeat: 10 * 1000,
				}),
			);

			runtimeLogger.info('🔥 Hot Module Replacement enabled');
		}
	};
}

export function configureGlobalMiddleware(app: Application): void {
	return createGlobalMiddleware()(app);
}

function haltOnTimedout(req: RequestWithTimedout, res: Response, next: NextFunction): void {
	if (!req.timedout) {
		next();
	} else {
		res.status(408).json({ error: 'Request timeout' });
	}
}
