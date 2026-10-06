import express, { Application } from 'express';

import { isProdEnv } from './envConfigDetails';
import { generateBuildTime } from './helper';
import { configureGlobalMiddleware } from './bootstrap/middleware';
import { configureStaticAssets, configureTemplateRendering } from './bootstrap/static';
import { registerRoutes } from './bootstrap/routes';

const app: Application = express();

generateBuildTime();
configureGlobalMiddleware(app);

const bundleConfig = isProdEnv
	? ['en', 'vendor', 'app'].map((item) => `/public/${item}.[chunkhash].js`)
	: ['en', 'vendor', 'app'].map((item) => `/public/${item}.bundle.js`);

configureStaticAssets(app);
configureTemplateRendering(app);
registerRoutes(app, bundleConfig);

export { app };
