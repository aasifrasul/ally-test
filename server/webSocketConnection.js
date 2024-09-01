const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { execute, subscribe } = require('graphql');

const { schema } = require('./schema');

const { logger } = require('./Logger');

let wsServer = null;
let wsServerCleanup = null;

const connectWSServer = (httpServer) => {
	wsServer = new WebSocketServer({
		server: httpServer,
		path: '/graphql',
	});

	wsServerCleanup = useServer(
		{
			schema,
			execute,
			subscribe,
		},
		wsServer,
	);
};

async function disconnectWSServer() {
	await wsServerCleanup.dispose();

	if (wsServer) {
		logger.info('Closing WebSocket server...');
		await new Promise((resolve, reject) => {
			wsServer.close((err) => {
				if (err) {
					logger.error('Error closing WebSocket server:', err);
					return reject(err);
				}
				logger.info('WebSocket server closed.');
				resolve();
			});
		});
	}
}

module.exports = { connectWSServer, disconnectWSServer };
