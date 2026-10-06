import express, { Application, NextFunction, Request, Response } from 'express';

import { isProdEnv } from './envConfigDetails';
import { compiledTemplate, fetchImage, fetchWineData, userAgentHandler } from './middlewares';
import { finalHandler } from './globalErrorHandler';
import { constructReqDataObject, generateBuildTime } from './helper';
import { constants } from '../../src/constants';
import { authRoutes } from './routes/authRoutes';
import { chatRoute } from './routes/chat';
import { errorHandler } from './middlewares/errorHandler';
import { PostgresDBConnection } from './dbClients/PostgresDBConnection';
import { MongoDBConnection } from './dbClients/MongoDBConnection';
import { RedisClient } from './cachingClients/redis';
import { configureGlobalMiddleware } from './bootstrap/middleware';
import { configureStaticAssets, configureTemplateRendering } from './bootstrap/static';

const app: Application = express();

generateBuildTime();
configureGlobalMiddleware(app);

app.get('/health', async (_, res) => {
	const mongoHealthy = await MongoDBConnection.isAvailable();
	const postgresHealthy = await PostgresDBConnection.isConnected();
	const redisHealthy = RedisClient.getInstance().isAvailable();
	const status = postgresHealthy || mongoHealthy || redisHealthy ? 'healthy' : 'unhealthy';
	res.status(status === 'healthy' ? 200 : 503).json({
		status,
		postgresHealthy,
		mongoHealthy,
		redisHealthy,
	});
});

app.use('/auth', authRoutes);
app.get('/api/fetchWineData/', fetchWineData);
app.use('/api/chat', chatRoute);
app.get('/images/', fetchImage);

app.use('/login', (_, res: Response) => {
	res.redirect('/auth/login');
});

configureStaticAssets(app);
configureTemplateRendering(app);

const bundleConfig = isProdEnv
	? ['en', 'vendor', 'app'].map((item) => `/public/${item}.[chunkhash].js`)
	: ['en', 'vendor', 'app'].map((item) => `/public/${item}.bundle.js`);

app.all(['/', '/:route'], (req: any, res: Response, next: NextFunction) => {
	const { route } = req.params;
	if (route && !constants.routes!.includes(route)) {
		return next();
	}

	const data = {
		js: bundleConfig,
		...constructReqDataObject(req),
		user: req.user,
		dev: !isProdEnv,
		layout: false,
	};
	res.send(compiledTemplate(data));
});

finalHandler(app);
app.use(errorHandler);

export { app };
