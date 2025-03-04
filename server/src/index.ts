#!/usr/bin/env node

import http from 'http';

import { port, host } from './envConfigDetails';
import MongoDBConnection from './dbClients/MongoDBConnection';
import { connectToIOServer, disconnectIOServer } from './socketConnection';
import { connectWSServer, disconnectWSServer } from './webSocketConnection';
import { getDBInstance, type DBInstance } from './schema/helper';
import { constants } from './constants';
import { app } from './app';
import { logger } from './Logger';

const httpServer: http.Server = http.createServer(app);

MongoDBConnection.getInstance()?.connect();

// httpServer.on('request', () => logger.info('httpServer.request'));

httpServer.listen(Number(port), Number(host), () =>
	logger.info(`node httpServer listening on port ${Number(port)}`),
);

connectWSServer(httpServer);
connectToIOServer(httpServer);

let isShuttingDown = false;

process.on('unhandledRejection', (error: unknown) => {
	if (error instanceof Error) {
		logger.error(`Unhandled Rejection: ${error.message}`);
	} else {
		logger.error('Unhandled Rejection: Unknown error occurred');
	}

	if (process.env.NODE_ENV === 'production') {
		void gracefulShutdown('unhandledRejection');
	}
});

process.on('uncaughtException', (e) => {
	logger.error(`uncaughtException: ${e.stack}`);
	// Force exit on uncaught exceptions after logging
	process.exit(1);
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

	const shutdownTimeout = setTimeout(() => {
		logger.error('Forced shutdown due to timeout');
		process.exit(1);
	}, 15000);

	try {
		logger.info('Closing HTTP server...');
		await new Promise<void>((resolve, reject) => {
			httpServer.close((err) => {
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
		const mongoDBInstance = MongoDBConnection.getInstance();
		await Promise.all([
			disconnectIOServer().catch((err) =>
				logger.error('Error disconnecting IO server:', err),
			),
			disconnectWSServer().catch((err) =>
				logger.error('Error disconnecting WS server:', err),
			),
			mongoDBInstance &&
				mongoDBInstance
					.cleanup()
					.catch((err) => logger.error('Error cleaning up MongoDB:', err)),
		]);

		// Then cleanup database instances
		const dbInstance: DBInstance = await getDBInstance(constants.dbLayer.currentDB);
		if (dbInstance) {
			logger.info('Cleaning up DB instance...');
			await dbInstance
				.cleanup()
				.catch((err) => logger.error('Error cleaning up DB instance:', err));
		}

		clearTimeout(shutdownTimeout);
		logger.info('Graceful shutdown completed');
		process.exit(0);
	} catch (error) {
		logger.error('Error during shutdown:', error);
		clearTimeout(shutdownTimeout);
		process.exit(1);
	}
}
