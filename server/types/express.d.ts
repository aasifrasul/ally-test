import type { IUser, TokenPayload } from '../src/types';

declare global {
	namespace Express {
		interface Request {
			user?: IUser | TokenPayload;
			traceId?: string;
		}
	}
}

export {};
