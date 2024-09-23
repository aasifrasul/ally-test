import {
	PostgresDBConnection,
	PostgresDBConnectionConfig,
	DatabaseConnectionError,
	QueryExecutionError,
} from '../PostgresDBConnection';
import { Pool, PoolClient } from 'pg';
import { constants } from '../../constants';
import { logger } from '../../Logger';

jest.mock('pg');
jest.mock('../constants', () => ({
	constants: {
		dbLayer: {
			postgres: {
				host: 'localhost',
				port: 5432,
				database: 'testdb',
				user: 'testuser',
				password: 'testpass',
			},
		},
	},
}));
jest.mock('../Logger');

describe('PostgresDBConnection', () => {
	let mockPool: jest.Mocked<Pool>;
	let mockClient: jest.Mocked<PoolClient>;

	beforeEach(() => {
		jest.clearAllMocks();
		mockClient = {
			query: jest.fn(),
			release: jest.fn(),
		} as unknown as jest.Mocked<PoolClient>;
		mockPool = {
			connect: jest.fn().mockResolvedValue(mockClient),
			on: jest.fn(),
			end: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<Pool>;
		(Pool as jest.Mock).mockImplementation(() => mockPool);
	});

	afterEach(async () => {
		const instance = await PostgresDBConnection.getInstance(
			{} as PostgresDBConnectionConfig,
		);
		await instance.cleanup();
	});

	describe('getInstance', () => {
		it('should create a new instance if one does not exist', async () => {
			const config: PostgresDBConnectionConfig = { maxConnections: 10 };
			const instance = await PostgresDBConnection.getInstance(config);
			expect(instance).toBeInstanceOf(PostgresDBConnection);
			expect(Pool).toHaveBeenCalledWith(
				expect.objectContaining({
					...constants.dbLayer.postgres,
					max: 10,
					connectionTimeoutMillis: 10000,
				}),
			);
		});

		it('should return the existing instance if one exists', async () => {
			const config: PostgresDBConnectionConfig = {};
			const instance1 = await PostgresDBConnection.getInstance(config);
			const instance2 = await PostgresDBConnection.getInstance(config);
			expect(instance1).toBe(instance2);
		});

		it('should throw DatabaseConnectionError if connection fails', async () => {
			mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));
			await expect(PostgresDBConnection.getInstance({})).rejects.toThrow(
				DatabaseConnectionError,
			);
		});
	});

	describe('executeQuery', () => {
		it('should execute a query and return results', async () => {
			const mockRows = [{ id: 1, name: 'Test' }];
			mockClient.query.mockResolvedValueOnce({ rows: mockRows, rowCount: 1 } as any);

			const instance = await PostgresDBConnection.getInstance({});
			const result = await instance.executeQuery('SELECT * FROM test');

			expect(result).toEqual(mockRows);
			expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
			expect(mockClient.release).toHaveBeenCalled();
		});

		it('should execute a query with parameters', async () => {
			const mockRows = [{ id: 1, name: 'Test' }];
			mockClient.query.mockResolvedValueOnce({ rows: mockRows, rowCount: 1 } as any);

			const instance = await PostgresDBConnection.getInstance({});
			const result = await instance.executeQuery('SELECT * FROM test WHERE id = $1', [
				1,
			]);

			expect(result).toEqual(mockRows);
			expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM test WHERE id = $1', [
				1,
			]);
		});

		it('should throw QueryExecutionError if query fails', async () => {
			mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

			const instance = await PostgresDBConnection.getInstance({});
			await expect(instance.executeQuery('SELECT * FROM test')).rejects.toThrow(
				QueryExecutionError,
			);
		});

		it('should throw an error if attempting to execute a query during shutdown', async () => {
			const instance = await PostgresDBConnection.getInstance({});
			await instance.cleanup();

			await expect(instance.executeQuery('SELECT * FROM test')).rejects.toThrow(
				'Database connection is shutting down, no new queries allowed',
			);
		});
	});

	describe('cleanup', () => {
		it('should end the pool when cleanup is called', async () => {
			const instance = await PostgresDBConnection.getInstance({});
			await instance.cleanup();

			expect(mockPool.end).toHaveBeenCalled();
		});

		it('should log an error if pool closure fails', async () => {
			mockPool.end.mockRejectedValueOnce(new Error('Pool closure failed'));

			const instance = await PostgresDBConnection.getInstance({});
			await instance.cleanup();

			expect(logger.error).toHaveBeenCalledWith(
				expect.stringContaining('PostgresDBConnection failed to close pool'),
			);
		});
	});
});
