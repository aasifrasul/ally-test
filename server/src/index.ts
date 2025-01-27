#!/usr/bin/env node

import { config } from 'dotenv';
import http from 'http';

import { pathRootDir } from './paths';
import MongoDBConnection from './dbClients/MongoDBConnection';
import { connectToIOServer, disconnectIOServer } from './socketConnection';
import { connectWSServer, disconnectWSServer } from './webSocketConnection';
import { getDBInstance, type DBInstance } from './schema/helper';
import { constants } from './constants';
import { app } from './app';
import { logger } from './Logger';

config({ path: `${pathRootDir}/.env` });

const { NODE_PORT: port, NODE_HOST: host } = process.env;

const httpServer: http.Server = http.createServer(app);

MongoDBConnection.getInstance().connect();

/**
 *
 * httpServer.on('connection', (socket) =>
 *     socket.on('close', () => logger.info('httpServer.connection'))
 * );
 */

httpServer.on('request', () => logger.info('httpServer.request'));

httpServer.listen(Number(port), Number(host), () =>
	logger.info(`node httpServer listening on port ${Number(port)}`),
);

connectWSServer(httpServer);
connectToIOServer(httpServer);

let isExitCalled = false;

process.on('unhandledRejection', (error: unknown) => {
	if (error instanceof Error) {
		logger.error(`Unhandled Rejection: ${error.message}`);
	} else {
		logger.error('Unhandled Rejection: Unknown error occurred');
	}
});

process.on('uncaughtException', (e) => logger.error(`unhandledRejection: ${e.stack}`));

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.once('exit', () => {
	if (!isExitCalled) {
		isExitCalled = true;
		logger.info('Performing final synchronous cleanup');
		// Note: You can't use async operations here
	}
});

async function gracefulShutdown(signal: string): Promise<void> {
	logger.info(`Received ${signal}. Starting graceful shutdown...`);

	const shutdownTimeout = setTimeout(() => {
		logger.error('Could not close connections in time, forcefully shutting down');
		process.exit(1);
	}, 15000); // Force shutdown after 15 seconds

	try {
		await disconnectIOServer();

		await disconnectWSServer();

		// Close MongoDB connection
		await MongoDBConnection.getInstance().cleanup();

		const dbInstance: DBInstance = await getDBInstance(constants.dbLayer.currentDB);

		if (dbInstance) {
			await dbInstance.cleanup();
		}

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
