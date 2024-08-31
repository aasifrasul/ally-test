#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const socketio = require('socket.io');
const http = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { execute, subscribe } = require('graphql');

const { app } = require('./app');
const { onConnection } = require('./socketConnection');

const { schema, validateGraphqlSchema } = require('./schema');

const { logger } = require('./Logger');
const GenericDBConnection = require('./dbClients/GenericDBConnection');
const { NODE_PORT: port, NODE_HOST: host } = process.env;

validateGraphqlSchema(schema);

//Start the server
const server = http.createServer(app);

// Set up WebSocket server for subscriptions
const wsServer = new WebSocketServer({
	server,
	path: '/graphql',
});

const serverCleanup = useServer(
	{
		schema,
		execute,
		subscribe,
	},
	wsServer,
);

/**
 * 
 * server.on('connection', (socket) =>
	socket.on('close', () => logger.info('server.connection')),
);

server.on('request', () => logger.info('server.request'));

 */

server.listen(port, host, () => logger.info(`node server listening on port ${port}`));

const io = socketio(server);

io.on('connection', onConnection);

let isExitCalled = false;

process.on('unhandledRejection', (e) => logger.error(`unhandledRejection: ${e.stack}`));

process.on('uncaughtException', (e) => logger.error(`uncaughtException: ${e.stack}`));

// Graceful shutdown
process.on('SIGINT', () => {
	wsServerCleanup.dispose();

	httpServer.close(() => {
		console.log('Server closed');
		process.exit(0);
	});
});

process.once('exit', async () => {
	if (isExitCalled) {
		return;
	}

	await wsServerCleanup.dispose();

	isExitCalled = true;

	process.exit(0);
});
