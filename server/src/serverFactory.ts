import http from 'http';
import type { Application } from 'express';

import { constants } from './constants';
import { host, port } from './envConfigDetails';
import { logger } from './Logger';

export interface ServerFactoryOptions {
	app?: Application;
	host?: string;
	port?: number | string;
	onListen?: (server: http.Server) => void;
}

export interface StartServerOptions extends ServerFactoryOptions {
	server?: http.Server;
}

export interface ServerLifecycleDependencies {
	initializeConnections?: (httpServer: http.Server) => Promise<unknown>;
	closeActiveConnections?: () => Promise<unknown>;
}

export interface ServerLifecycleManager {
	start: () => http.Server;
	shutdown: (signal?: string) => Promise<void>;
	isStarted: () => boolean;
}

export function createServer(options: ServerFactoryOptions = {}): http.Server {
	const app =
		options.app ??
		(() => {
			// Keep the app dependency lazy so the factory can be imported without booting the entire server graph.
			// eslint-disable-next-line @typescript-eslint/no-var-requires
			const { createApp } = require('./app') as typeof import('./app');
			return createApp();
		})();
	const httpServer = http.createServer(app);

	httpServer.on('error', (error) => {
		logger.error('HTTP server error', error);
	});

	return httpServer;
}

export function createServerLifecycle(
	server: http.Server,
	options: Omit<StartServerOptions, 'server'> = {},
	dependencies: ServerLifecycleDependencies = {},
): ServerLifecycleManager {
	const resolvedHost = options.host ?? host ?? '0.0.0.0';
	const resolvedPort = Number(options.port ?? port ?? 3000);
	let hasStarted = false;
	let isShuttingDown = false;
	let handlersRegistered = false;
	const initializeConnections =
		dependencies.initializeConnections ?? (async () => undefined);
	const closeActiveConnections =
		dependencies.closeActiveConnections ?? (async () => undefined);

	const gracefulShutdown = async (signal: string): Promise<void> => {
		if (isShuttingDown) {
			logger.info('Shutdown already in progress...');
			if (signal === 'SIGINT' || signal === 'SIGTERM') {
				logger.error('Second signal received; forcing immediate shutdown');
				process.exit(constants.ExitCodes.FORCED_TIMEOUT);
			}
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
				server.close((error) => {
					if (error) {
						logger.error('Error closing HTTP server:', error);
						reject(error);
						return;
					}

					logger.info('HTTP server closed successfully');
					resolve();
				});
			});

			logger.info('Cleaning up active connections...');
			await closeActiveConnections().catch((error) => {
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
	};

	const registerProcessHandlers = () => {
		if (handlersRegistered) {
			return;
		}

		handlersRegistered = true;

		process.on('unhandledRejection', (error: unknown) => {
			const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
			logger.error(`Unhandled Rejection: ${errorMsg}`);
			setTimeout(() => {
				void gracefulShutdown('unhandledRejection');
			}, 5000);
		});

		process.on('uncaughtException', (error) => {
			logger.error(`uncaughtException: ${error.stack ?? String(error)}`);
			void gracefulShutdown('uncaughtException');
		});

		process.on('SIGINT', () => {
			logger.info('Received SIGINT (Ctrl+C)');
			void gracefulShutdown('SIGINT');
		});

		process.on('SIGTERM', () => {
			logger.info('Received SIGTERM');
			void gracefulShutdown('SIGTERM');
		});

		process.on('exit', (code) => {
			logger.info(`Process exiting with code: ${code}`);
		});
	};

	const lifecycle: ServerLifecycleManager = {
		start: () => {
			if (hasStarted) {
				return server;
			}

			hasStarted = true;
			registerProcessHandlers();
			server.listen(resolvedPort, resolvedHost, () => {
				logger.info(
					`Server running at http://${resolvedHost}:${resolvedPort} [${process.env.NODE_ENV}]`,
				);
				options.onListen?.(server);
			});
			void initializeConnections(server);
			return server;
		},
		shutdown: async (signal = 'manual') => {
			await gracefulShutdown(signal);
			hasStarted = false;
			isShuttingDown = false;
		},
		isStarted: () => hasStarted,
	};

	return lifecycle;
}

export function startServer(options: StartServerOptions = {}): http.Server {
	const server = options.server ?? createServer(options);
	const { closeActiveConnections, initializeConnections } =
		require('./dbClients/helper') as {
			closeActiveConnections: () => Promise<unknown>;
			initializeConnections: (httpServer: http.Server) => Promise<unknown>;
		};
	const lifecycle = createServerLifecycle(server, options, {
		closeActiveConnections,
		initializeConnections,
	});
	return lifecycle.start();
}
