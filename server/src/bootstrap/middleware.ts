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

export function configureGlobalMiddleware(app: Application): void {
	const globalLimiter = rateLimit({
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
			origin: isProdEnv
				? ALLOWED_ORIGINS?.split(',')
				: [
						`http://${host}:${port}`,
						`http://localhost:${port}`,
						`http://127.0.0.1:${port}`,
					],
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowedHeaders: ['Content-Type', 'Authorization'],
			credentials: true,
		}),
	);

	app.use(
		helmet({
			contentSecurityPolicy: isProdEnv ? undefined : false,
		}),
	);

	app.use(express.json({ limit: '1mb' }));
	app.use(express.urlencoded({ extended: true, limit: '100kb' }));
	app.use(bodyParser.text());
	app.use(timeout('30s'));
	app.use(haltOnTimedout as express.RequestHandler);
	app.use((req: RequestWithId, _: unknown, next: NextFunction) => {
		req.id = uuidv4();
		next();
	});
	app.use(optionalAuth);

	if (!isProdEnv) {
		app.use('/public', (req, res, next) => {
			if (req.path && req.path.endsWith('.ts')) {
				res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
			}
			next();
		});

		const webpackConfig = require('../../webpack-configs/webpack.config');
		const compiler = webpack(webpackConfig) as any;

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

		logger.info('🔥 Hot Module Replacement enabled');
	}
}

function haltOnTimedout(req: RequestWithTimedout, res: Response, next: NextFunction): void {
	if (!req.timedout) {
		next();
	} else {
		res.status(408).json({ error: 'Request timeout' });
	}
}
