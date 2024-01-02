#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const socketio = require('socket.io');
const http = require('http');

const { app } = require('./app');
const { onConnection } = require('./socketConnection');
const { logger } = require('./Logger');

const { NODE_PORT: port, NODE_HOST: host } = process.env;

//Start the server
const server = http.createServer(app);

server.on('connection', (socket) => socket.on('close', () => logger.log('server.connection')));
server.on('request', () => logger.log('server.request'));
server.listen(port, host, () => logger.log(`webpack-dev-server listening on port ${port}`));

const io = socketio(server);

io.on('connection', onConnection);

let isExitCalled = false;

// eslint-disable-next-line no-console
process.on('unhandledRejection', (e) => logger.error(e));
// eslint-disable-next-line no-console
process.on('uncaughtException', (e) => logger.error(e));

process.once('exit', () => {
	if (isExitCalled) {
		return;
	}

	isExitCalled = true;

	process.exit(0);
});
