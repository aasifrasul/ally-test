import express, { Application } from 'express';

import { isProdEnv } from './envConfigDetails';
import { generateBuildTime } from './helper';
import {
	configureGlobalMiddleware,
	configureStaticAssets,
	configureTemplateRendering,
	registerHealthCheck,
	registerRoutes,
} from './bootstrap';

export function createApp(): Application {
	const app: Application = express();

	generateBuildTime();
	configureGlobalMiddleware(app);

	const bundleConfig = isProdEnv
		? ['en', 'vendor', 'app'].map((item) => `/public/${item}.[chunkhash].js`)
		: ['en', 'vendor', 'app'].map((item) => `/public/${item}.bundle.js`);

	configureStaticAssets(app);
	configureTemplateRendering(app);
	registerHealthCheck(app);
	registerRoutes(app, bundleConfig);

	return app;
}

export const app = createApp();
