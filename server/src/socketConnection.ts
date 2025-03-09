import * as os from 'os';
import * as http from 'http';
import { Server, Socket } from 'socket.io';

import { host, port } from './envConfigDetails';
import { constants } from './constants';
import { logger } from './Logger';

let io: Server;

const connectToIOServer = (httpServer: http.Server): Promise<void> =>
	new Promise((resolve, reject) => {
		try {
			io = new Server(httpServer, {
				cors: {
					origin: `http://${host}:${port}`,
					methods: ['GET', 'POST'],
				},
			});

			io.on('connection', onConnection);

			io.on('error', (err: Error): void => {
				logger.error(`SocketIO error: ${err.message}`);
				reject(err);
			});

			resolve();
		} catch (err) {
			const error = err as Error;
			logger.error(`SocketIO connection failed: ${error.message}`);
			reject(err);
		}
	});

const disconnectIOServer = (): Promise<void> =>
	new Promise((resolve, reject) => {
		if (io) {
			io.close((err) => {
				if (err) {
					logger.error(`Error closing SocketIO server: ${err}`);
					return reject(err);
				}
				logger.info('SocketIO server closed.');
				resolve();
			});
		}
	});

function onConnection(socket: Socket): void {
	const getRandomInt = (max: number): number => Math.floor(Math.random() * max);

	let intervalId: NodeJS.Timeout | null = null;

	socket.on('fetchOSStats', (): void => {
		const data = os.cpus()[0];
		logger.info(`OS Stats: ${JSON.stringify(data)}`);
		socket.emit('oSStatsData', data);
	});

	socket.on('fetchCurrencyPair', (): void => {
		intervalId && clearInterval(intervalId);
		intervalId = setInterval(() => {
			const { currencyPairs } = constants;
			const data = currencyPairs[getRandomInt(currencyPairs.length)];
			socket.emit('currencyPairData', data);
		}, 1000);
	});

	socket.on('stopFetchCurrencyPair', (): void => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	});

	socket.on('error', (err: Error): void => {
		logger.error(`Socket error: ${err.message}`);
		if (err.message === 'unauthorized event') {
			socket.disconnect();
		}
	});

	socket.on('disconnect', () => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	});
}

export { connectToIOServer, disconnectIOServer };
