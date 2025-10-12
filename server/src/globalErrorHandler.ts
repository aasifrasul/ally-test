// Create a new file called globalErrorHandler.ts

import type { Application, Request, Response, NextFunction, RequestHandler } from 'express';

import { isCurrentEnvProd } from './envConfigDetails';
import { logger } from './Logger';

/**
 * Wraps all route handlers in the Express application with async error handling
 * @param app Express application instance
 */
export function setupGlobalAsyncErrorHandling(app: Application): void {
	const methods: (keyof Application)[] = ['get', 'post', 'put', 'delete', 'patch'];

	methods.forEach((method) => {
		const originalMethod = app[method].bind(app);

		app[method] = function (path: string, ...handlers: RequestHandler[]) {
			const wrappedHandlers = handlers.map(
				(handler) =>
					async function (
						req: Request,
						res: Response,
						next: NextFunction,
					): Promise<void> {
						try {
							return Promise.resolve(handler(req, res, next)).catch(next);
						} catch (err) {
							next(err);
						}
					},
			);
			return originalMethod(path, ...wrappedHandlers);
		} as any; // Type assertion since Express's type definitions are complex
	});

	// Add the error handling middleware
	app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
		logger.error(`Route error: ${err.message}`);
		logger.error(err.stack);

		const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

		res.status(statusCode).json({
			message: err.message,
			stack: isCurrentEnvProd ? '🥞' : err.stack,
		});
	});
}

export function finalHandler(app: Application): void {
	// 404 handler for routes that don't exist
	app.all('*', (req: Request, res: Response, next: NextFunction) => {
		res.status(404);
		logger.warn(`Route not found: ${req.originalUrl}`);
		const message = 'Oops! Page not found.';

		if (req.accepts('html')) {
			res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Error</title>
                </head>
                <body>
                    <h1>${message}</h1>
                </body>
                </html>
            `);
		} else {
			res.json({ message });
		}
	});
}
