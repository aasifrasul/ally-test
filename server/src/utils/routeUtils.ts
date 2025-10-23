import type { RequestHandler, Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
) => void | Promise<void>;

/**
 * Wraps an async Express route to handle errors automatically.
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};
 */

// Enhanced async handler with proper TypeScript typing
export const asyncHandler = (
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
	return (req: Request, res: Response, next: NextFunction): void => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

/**
 * Wraps a normal or async middleware in asyncHandler.
 */
export const wrapAsync = (fn: RequestHandler): RequestHandler => {
	return asyncHandler(async (req, res, next) => {
		await Promise.resolve(fn(req, res, next));
	});
};

/**
 * Composes multiple middlewares with an async-safe handler.
 */
export const applyMiddlewares = (
	middlewares: RequestHandler[],
	handler: RequestHandler,
): RequestHandler[] => {
	return [...middlewares.map(wrapAsync), wrapAsync(handler)];
};
