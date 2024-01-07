#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const socketio = require('socket.io');
const http = require('http');

const { app } = require('./app');
const { onConnection } = require('./socketConnection');
const { logger } = require('./Logger');
const { safeStringify } = require('./helper');
const { dbCleanup } = require('./schema');

const { NODE_PORT: port, NODE_HOST: host } = process.env;

//Start the server
const server = http.createServer(app);

server.on('connection', (socket) =>
	socket.on('close', () => logger.info('server.connection')),
);
server.on('request', () => logger.info('server.request'));
server.listen(port, host, () => logger.info(`webpack-dev-server listening on port ${port}`));

const io = socketio(server);

io.on('connection', onConnection);

let isExitCalled = false;

process.on('unhandledRejection', (e) =>
	logger.error(`unhandledRejection: ${JSON.stringify(e)}`),
);

process.on('uncaughtException', (e) =>
	logger.error(`uncaughtException: ${JSON.stringify(e)}`),
);

process.once('exit', () => {
	if (isExitCalled) {
		return;
	}

	dbCleanup();

	isExitCalled = true;

	process.exit(0);
});
