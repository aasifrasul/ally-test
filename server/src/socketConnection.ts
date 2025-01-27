import * as os from 'os';
import * as http from 'http';
import { Server, Socket } from 'socket.io';
import { constants } from './constants';
import { logger } from './Logger';

let io: Server;

const connectToIOServer = (httpServer: http.Server): void => {
	io = new Server(httpServer);
	logger.info('SocketIO connection established.');
	io.on('connection', onConnection);
};

const disconnectIOServer = (): void => {
	logger.info('SocketIO connection closed.');
	io?.close();
};

function onConnection(socket: Socket): void {
	const getRandomInt = (max: number): number => Math.floor(Math.random() * max);

	let intervalId: NodeJS.Timeout | null = null;

	socket.on('fetchOSStats', (): void => {
		const data = os.cpus();
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
