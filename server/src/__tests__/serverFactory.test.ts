import http from 'http';
import express from 'express';

import { createServer, createServerLifecycle } from '../serverFactory';
import { createGlobalMiddleware } from '../bootstrap/middleware';

jest.mock('../middlewares', () => ({
	handleGraphql: jest.fn(),
	userAgentHandler: jest.fn(),
}));

jest.mock('../fileUploads', () => ({
	handleFileupload: jest.fn(),
}));

jest.mock('../setupProxy', () => ({
	setupProxy: jest.fn(),
}));

jest.mock('../Logger', () => ({
	logger: {
		info: jest.fn(),
	},
}));

jest.mock('../middlewares/authMiddleware', () => ({
	optionalAuth: jest.fn((req, res, next) => next()),
}));

jest.mock('webpack-dev-middleware', () => ({
	__esModule: true,
	default: jest.fn(() => jest.fn()),
}));

jest.mock('webpack-hot-middleware', () => ({
	__esModule: true,
	default: jest.fn(() => jest.fn()),
}));

describe('createServer', () => {
	it('creates a server instance without starting the application lifecycle immediately', () => {
		const app = express();
		const server = createServer({
			app,
			port: 0,
			host: '127.0.0.1',
		});

		expect(server).toBeInstanceOf(http.Server);
		expect(server.listening).toBe(false);
		expect(server.address()).toBeNull();
	});

	it('creates an explicit lifecycle manager that only starts once', () => {
		const server = {
			listen: jest.fn(),
			close: jest.fn(),
		} as unknown as http.Server;
		const lifecycle = createServerLifecycle(server, {
			port: 0,
			host: '127.0.0.1',
		});

		expect(lifecycle.isStarted()).toBe(false);
		expect(lifecycle.start()).toBe(server);
		expect(lifecycle.isStarted()).toBe(true);
		expect(lifecycle.start()).toBe(server);
		expect((server.listen as jest.Mock).mock.calls.length).toBe(1);
	});
});

describe('createGlobalMiddleware', () => {
	it('creates an explicit middleware setup factory with dependency injection', () => {
		const app = {
			use: jest.fn(),
			all: jest.fn(),
			get: jest.fn(),
		} as any;
		const logger = { info: jest.fn() };
		const loadWebpackConfig = jest.fn(() => ({
			output: { publicPath: '/assets/' },
		}));
		const webpackFactory = jest.fn(() => ({
			context: 'mock-compiler',
			getInfrastructureLogger: jest.fn(() => ({
				info: jest.fn(),
				error: jest.fn(),
				warn: jest.fn(),
			})),
		})) as any;

		const setupMiddleware = createGlobalMiddleware({
			app,
			host: 'localhost',
			port: 3000,
			isProdEnv: false,
			ALLOWED_ORIGINS: 'http://localhost:3000',
			logger,
			loadWebpackConfig,
			webpackFactory,
		});

		setupMiddleware(app as any);

		expect(typeof setupMiddleware).toBe('function');
		expect(loadWebpackConfig).toHaveBeenCalled();
		expect(webpackFactory).toHaveBeenCalled();
		expect(app.use).toHaveBeenCalled();
		expect(logger.info).toHaveBeenCalledWith('🔥 Hot Module Replacement enabled');
	});
});
