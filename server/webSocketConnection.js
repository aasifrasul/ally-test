const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { execute, subscribe } = require('graphql');

const { schema } = require('./schema');

let wsServerCleanup = null;

const connectWSServer = (httpServer) => {
	const wsServer = new WebSocketServer({
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

const disconnectWSServer = async () => {
	logger.info('Disposing WebSocket server...');
	await wsServerCleanup.dispose();
	logger.info('WebSocket server disposed.');
};

module.exports = { connectWSServer, disconnectWSServer };
