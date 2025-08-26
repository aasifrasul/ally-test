#!/usr/bin/env node

import http from 'http';

import { port, host } from './envConfigDetails';
import { MongoDBConnection } from './dbClients/MongoDBConnection';
import { RedisClient } from './cachingClients/redis';
import { connectToIOServer, disconnectIOServer } from './socketConnection';
import { connectWSServer, disconnectWSServer } from './webSocketConnection';
import { getDBInstance } from './dbClients/helper';
import { constants } from './constants';
import { app } from './app';
import { logger } from './Logger';

const httpServer: http.Server = http.createServer(app);

MongoDBConnection.initialize();
RedisClient.getInstance()?.connect();

// httpServer.on('request', () => logger.info('httpServer.request'));

httpServer.listen(Number(port), host, () =>
	logger.info(`Server running at http://${host}:${port} [${process.env.NODE_ENV}]`),
);

connectWSServer(httpServer);
connectToIOServer(httpServer);

let isShuttingDown = false;

process.title = 'ally-test';

process.on('unhandledRejection', (error: unknown) => {
	const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
	logger.error(`Unhandled Rejection: ${errorMsg}`);
	void gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (e) => {
	logger.error(`uncaughtException: ${e.stack}`);
	void gracefulShutdown('uncaughtException');
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
	logger.info('Received SIGINT (Ctrl+C)');
	void gracefulShutdown('SIGINT');
});

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => {
	logger.info('Received SIGTERM');
	void gracefulShutdown('SIGTERM');
});

// Cleanup handler - only for synchronous operations
process.on('exit', (code) => {
	logger.info(`Process exiting with code: ${code}`);
	// Perform any final synchronous cleanup here
	// Note: Async operations won't work in 'exit' handler
});

async function gracefulShutdown(signal: string): Promise<void> {
	if (isShuttingDown) {
		logger.info('Shutdown already in progress...');
		return;
	}

	isShuttingDown = true;
	logger.info(`Received ${signal}. Starting graceful shutdown...`);

	const timeoutId = setTimeout(() => {
		logger.error('Forced shutdown due to timeout');
		process.exit(constants.ExitCodes.FORCED_TIMEOUT);
	}, 15000);

	try {
		logger.info('Closing HTTP server...');
		await new Promise<void>((resolve, reject) => {
			httpServer.close((err: Error | undefined) => {
				if (err) {
					logger.error('Error closing HTTP server:', err);
					reject(err);
				} else {
					logger.info('HTTP server closed successfully');
					resolve();
				}
			});
		});

		logger.info('Cleaning up active connections...');
		await Promise.allSettled([
			MongoDBConnection.getInstance()?.cleanup(),
			RedisClient.getInstance()?.cleanup(),
			(await getDBInstance(constants.dbLayer.currentDB))?.cleanup(),
			disconnectIOServer(),
			disconnectWSServer(),
		]).catch((error) => {
			logger.error(`failed to close active Connections ${error}`);
		});

		logger.info('Graceful shutdown completed');
		process.exit(constants.ExitCodes.SUCCESS);
	} catch (error) {
		logger.error('Error during shutdown:', error);
		process.exit(constants.ExitCodes.ERROR);
	} finally {
		clearTimeout(timeoutId);
	}
}
