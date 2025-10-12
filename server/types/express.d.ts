// 1. Import your types as usual
import type { IUser, TokenPayload } from '../src/types';
// depending on where 'server/types/express.d.ts' is relative to 'server/src/types'.

declare namespace Express {
	export interface Request {
		user?: IUser | TokenPayload;
		traceId?: string;
	}
}
