import * as os from 'os';
import * as http from 'http';
import { Server } from 'socket.io';

import { logger } from './Logger';

let io: any;

const connectToIOServer = (httpServer: http.Server): void => {
	io = new Server(httpServer);
	logger.info('SocketIO connection established.');

	io.on('connection', onConnection);
};

const disconnectIOServer = (): void => {
	logger.info('SocketIO connection closed.');
	io && io.close();
};

const currencyPairs: Array<{ key: string; value: number }> = [
	{ key: 'EURUSD', value: 1.1857 },
	{ key: 'USDEUR', value: 0.8965 },
	{ key: 'INRUSD', value: 75.876 },
	{ key: 'USDINR', value: 0.0567 },
	{ key: 'YENUSD', value: 118.9857 },
	{ key: 'USDYEN', value: 0.0567 },
	{ key: 'EURINR', value: 3.567 },
	{ key: 'INREUR', value: 78.987 },
	{ key: 'EURYEN', value: 3.567 },
	{ key: 'YENEUR', value: 0.00987 },
];

function onConnection(socket: any): void {
	const getRandomInt = (max: number): number => Math.floor(Math.random() * max);

	let IntervalId: NodeJS.Timeout | null = null;

	socket.on('fetchOSStats', (): void => {
		const data = os.cpus();
		logger.info(`info ${data}`);
		socket.emit('oSStatsData', data);
	});

	// handle the new message event
	socket.on('fetchCurrencyPair', (): void => {
		IntervalId && clearInterval(IntervalId);
		IntervalId = setInterval(() => {
			const data = currencyPairs[getRandomInt(currencyPairs.length)];
			socket.emit('currencyPairData', data);
		}, 25);
	});

	socket.on('stopFetchCurrencyPair', (): void => {
		IntervalId && clearInterval(IntervalId);
	});

	socket.on('error', (err: Error | null): void => {
		if (err?.message === 'unauthorized event') {
			socket.disconnect();
		}
	});
}

export { connectToIOServer, disconnectIOServer };
