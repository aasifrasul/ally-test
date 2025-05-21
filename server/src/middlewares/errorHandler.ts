import { Request, Response, NextFunction } from 'express';

import { isCurrentEnvProd } from './envConfigDetails';

interface Error {
	stack?: string;
	message?: string;
}

interface RequestWithCorrelationId extends Request {
	correlationId?: string;
}

export const errorHandler = (
	err: Error,
	req: RequestWithCorrelationId,
	res: Response,
	next: NextFunction,
): void => {
	console.error(err.stack);
	res.status(500).json({
		error: {
			message:
				isCurrentEnvProd ? 'Internal Server Error' : err.message,
			correlationId: req.correlationId,
		},
	});
};
