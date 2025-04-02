import * as http from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

import { schema } from '../src/schema';
import { logger } from './Logger';

let wsServer: WebSocketServer | null = null;
let serverCleanup: any;

export const connectWSServer = (httpServer: http.Server): Promise<void> => {
	return new Promise((resolve, reject) => {
		try {
			wsServer = new WebSocketServer({
				server: httpServer,
				path: '/graphql',
			});

			logger.info('WebSocket server is starting on port 8080.');

			serverCleanup = useServer({ schema }, wsServer);

			wsServer.on('listening', () => {
				logger.info('WebSocket server is listening on port 8080.');
			});

			wsServer.on('connection', (socket) => {
				logger.info('WebSocket connection established.');
				socket.on('message', (message) => {
					logger.info(`Received message: ${message}`);
				});
				socket.on('close', () => {
					logger.info('WebSocket connection closed.');
				});
				socket.on('error', (error) => {
					logger.error(`WebSocket error: ${error}`);
				});
			});

			wsServer.on('error', (error) => {
				logger.error(`WebSocket server error: ${error}`);
				reject(error);
			});

			resolve();
		} catch (err) {
			logger.error(`WebSocket connection failed: ${err}`);
			reject(err);
		}
	});
};

export const disconnectWSServer = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (wsServer) {
			serverCleanup.dispose();

			wsServer.close((err) => {
				if (err) {
					logger.error(`Error closing WebSocket server: ${err}`);
					return reject(err);
				}
				logger.info('WebSocket server closed.');
				resolve();
			});
		} else {
			logger.info('WebSocket server is not running.');
			resolve();
		}
	});
};
