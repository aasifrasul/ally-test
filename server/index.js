#!/usr/bin/env node

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const http = require('http');

const { connectToMongoDB, disconnectFromMongoDB } = require('./dbClients/mongodb');
const { connectToIOServer, disconnectIOServer } = require('./socketConnection');
const { connectWSServer, disconnectWSServer } = require('./webSocketConnection');

const { app } = require('./app');

const { logger } = require('./Logger');
const GenericDBConnection = require('./dbClients/GenericDBConnection');
const { NODE_PORT: port, NODE_HOST: host } = process.env;

(async () => {
	await connectToMongoDB();
})();

//Start the httpServer
const httpServer = http.createServer(app);

connectWSServer(httpServer);

connectToIOServer(httpServer);

/**
 * 
 * httpServer.on('connection', (socket) =>
	socket.on('close', () => logger.info('httpServer.connection')),
);

httpServer.on('request', () => logger.info('httpServer.request'));

 */

httpServer.listen(port, host, () => logger.info(`node httpServer listening on port ${port}`));

let isExitCalled = false;

process.on('unhandledRejection', (e) => logger.error(`unhandledRejection: ${e.stack}`));

process.on('uncaughtException', (e) => logger.error(`uncaughtException: ${e.stack}`));

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.once('exit', () => {
	if (isExitCalled) {
		return;
	}

	isExitCalled = true;

	// Perform synchronous cleanup operations here
	logger.info('Performing final synchronous cleanup');
	// Note: You can't use async operations here
});

async function gracefulShutdown(signal) {
	logger.info(`Received ${signal}. Starting graceful shutdown...`);

	const shutdownTimeout = setTimeout(() => {
		logger.error('Could not close connections in time, forcefully shutting down');
		process.exit(1);
	}, 15000); // Force shutdown after 15 seconds

	try {
		disconnectIOServer();

		await disconnectWSServer();

		// Close MongoDB connection
		disconnectFromMongoDB();

		// Close HTTP server
		logger.info('Closing HTTP server...');
		await new Promise((resolve) => {
			httpServer.close(resolve);
		});
		logger.info('HTTP server closed.');

		clearTimeout(shutdownTimeout);
		logger.info('Graceful shutdown completed.');
		process.exit(0);
	} catch (error) {
		logger.error('Error during shutdown:', error);
		clearTimeout(shutdownTimeout);
		process.exit(1);
	}
}
