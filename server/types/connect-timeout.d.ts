declare module 'connect-timeout' {
	import { RequestHandler } from 'express';
	function timeout(time: string | number, options?: { respond?: boolean }): RequestHandler;
	export = timeout;
}
