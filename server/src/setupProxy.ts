import { Application, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http'; // Import Node.js http types

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

	// Fixed OKR Central proxy configuration
	const proxyConfig2 = {
		target: 'https://okrcentral.github.io', // Base domain only
		changeOrigin: true,
		pathRewrite: {
			'^/proxy/okrcentral': '/sample-okrs/db.json', // Rewrite to the correct path
		},
		// Corrected type annotations here:
		onProxyReq: (proxyReq: ClientRequest, req: Request, res: Response) => {
			// Log for debugging
			console.log('Proxying request to:', proxyReq.getHeader('host') + proxyReq.path);
		},
		onProxyRes: (proxyRes: IncomingMessage, req: Request, res: Response) => {
			// Ensure proper CORS headers
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		},
		onError: (err: Error, req: Request, res: Response) => {
			console.error('Proxy error:', err);
			res.status(500).json({ error: 'Proxy error', details: err.message });
		},
	};
	app.use('/proxy/okrcentral', createProxyMiddleware(proxyConfig2));
};
