import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { CloseCode, makeServer } from 'graphql-ws';
import { schema } from '../src/schema';
import { logger } from './Logger';

let wsServer: WebSocketServer | null = null;
let server: ReturnType<typeof makeServer>;

export const connectWSServer = (httpServer: Server): Promise<void> => {
	return new Promise((resolve, reject) => {
		try {
			// Create the GraphQL-WS server
			server = makeServer({ schema });

			// Create WebSocket server
			wsServer = new WebSocketServer({
				server: httpServer,
				path: '/graphql',
			});

			const port = httpServer.address() || 'unknown';
			logger.info(`WebSocket server is starting on port ${port}.`);

			// Implement the GraphQL-WS protocol
			wsServer.on('connection', (socket, request) => {
				logger.info('WebSocket connection established.');

				// Let graphql-ws take over
				const closed = server.opened(
					{
						protocol: socket.protocol,
						send: (data) =>
							new Promise((resolve, reject) => {
								socket.send(data, (err) => (err ? reject(err) : resolve()));
							}),
						close: (code, reason) => socket.close(code, reason),
						onMessage: (cb) =>
							socket.on('message', async (event) => {
								try {
									logger.info(
										`Received GraphQL message: ${event.toString()}`,
									);
									await cb(event.toString());
								} catch (err) {
									logger.error(`GraphQL operation error: ${err}`);
									socket.close(
										CloseCode.InternalServerError,
										(err as Error).message,
									);
								}
							}),
					},
					// Pass values to the `extra` field in the context
					{ socket, request },
				);

				// Notify server that the socket closed
				socket.once('close', (code, reason) => {
					logger.info(
						`WebSocket connection closed with code: ${code}, reason: ${reason}`,
					);
					closed(code, 'closed');
				});

				socket.on('error', (error) => {
					logger.error(`WebSocket error: ${error}`);
				});
			});

			wsServer.on('listening', () => {
				logger.info('WebSocket server is listening on port 8080.');
				resolve();
			});

			wsServer.on('error', (error) => {
				logger.error(`WebSocket server error: ${error}`);
				reject(error);
			});
		} catch (err) {
			logger.error(`WebSocket connection failed: ${err}`);
			reject(err);
		}
	});
};

export const disconnectWSServer = (): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (wsServer) {
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
