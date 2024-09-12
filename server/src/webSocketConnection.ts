import { Server } from 'ws';
import { logger } from './Logger';

let wsServer: Server | null = null;

export const connectWSServer = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		try {
			wsServer = new Server({ port: 8080 });
			wsServer.on('connection', (socket) => {
				logger.info('WebSocket connection established.');
				socket.on('message', (message) => {
					logger.info(`Received message: ${message}`);
				});
			});
			resolve();
		} catch (err) {
			logger.error(`WebSocket connection failed ${err}.`);
			reject(err);
		}
	});
};

export const disconnectWSServer = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (wsServer) {
			wsServer.close((err) => {
				if (err) {
					return reject(err);
				}
				logger.info('WebSocket server closed.');
				resolve();
			});
		} else {
			resolve();
		}
	});
};
