const os = require('os');
const { logger } = require('./Logger');

const currencyPairs = [
	{
		key: 'EURUSD',
		value: 1.1857,
	},
	{
		key: 'USDEUR',
		value: 0.8965,
	},
	{
		key: 'INRUSD',
		value: 75.876,
	},
	{
		key: 'USDINR',
		value: 0.0567,
	},
	{
		key: 'YENUSD',
		value: 118.9857,
	},
	{
		key: 'USDYEN',
		value: 0.0567,
	},
	{
		key: 'EURINR',
		value: 3.567,
	},
	{
		key: 'INREUR',
		value: 78.987,
	},
	{
		key: 'EURYEN',
		value: 3.567,
	},
	{
		key: 'YENEUR',
		value: 0.00987,
	},
];

const onConnection = (socket) => {
	const getRandomInt = (max) => Math.floor(Math.random() * max);

	let IntervalId;

	socket.on('fetchOSStats', () => {
		const data = os.cpus();
		logger.info(`info ${data}`);
		socket.emit('oSStatsData', data);
	});

	//handle the new message event
	socket.on('fetchCurrencyPair', () => {
		IntervalId && clearInterval(IntervalId);
		IntervalId = setInterval(() => {
			const data = currencyPairs[getRandomInt(10)];
			socket.emit('currencyPairData', data);
		}, 25);
	});

	socket.on('stopFetchCurrencyPair', () => {
		IntervalId && clearInterval(IntervalId);
	});
};

module.exports = {
	onConnection,
};
