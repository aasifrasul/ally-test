#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const socketio = require('socket.io');
const http = require('http');

const { app } = require('./app');
const { onConnection } = require('./socketConnection');
const { logger } = require('./Logger');
const GenericDBConnection = require('./dbClients/GenericDBConnection');
const { NODE_PORT: port, NODE_HOST: host } = process.env;

process.on('SIGINT', () => {
	GenericDBConnection.instance.getDBInstance().pool.end(function (err) {
		// All connections in the pool have ended
		process.exit(err ? 1 : 0);
	});
});

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

process.on('unhandledRejection', (e) => logger.error(`unhandledRejection: ${e.stack}`));

process.on('uncaughtException', (e) => logger.error(`uncaughtException: ${e.stack}`));

process.once('exit', async () => {
	if (isExitCalled) {
		return;
	}

	isExitCalled = true;

	process.exit(0);
});
