import { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

export const setupProxy = (app: Application): void => {
	const proxyConfig = {
		target: 'https://newsapi.org/v2',
		changeOrigin: true,
		pathRewrite: {
			'^/api/news': '', // Remove the /api/news prefix when forwarding
		},
		headers: {
			'X-Api-key': 'd85ffa9e47de4423af6a356f3f48d0dc',
		},
	};

	app.use('/api/news', createProxyMiddleware(proxyConfig));

	const proxyConfig2 = {
		target: 'https://okrcentral.github.io',
		changeOrigin: true,
		pathRewrite: {
			'^/proxy/okrcentral': '',
		},
		router: {
			'/proxy/okrcentral': 'https://okrcentral.github.io/sample-okrs/db.json',
		},
	};

	app.use('/proxy/okrcentral', createProxyMiddleware(proxyConfig2));
};
