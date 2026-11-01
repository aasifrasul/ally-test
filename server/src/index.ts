#!/usr/bin/env node

import { createServer, startServer } from './serverFactory';

process.title = 'ally-test';

export const server = createServer();

if (require.main === module) {
	startServer({
		server,
	});
}
