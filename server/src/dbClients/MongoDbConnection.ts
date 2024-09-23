import mongoose from 'mongoose';

import { MongoDBConfig } from '../types';

import { constants } from '../constants';
import { logger } from '../Logger';

class MongoDBConnection {
	private static instance: MongoDBConnection;
	private isConnected: boolean = false;

	private constructor() {
		this.connect();
		this.setupConnectionListeners();
	}

	public static getInstance(): MongoDBConnection {
		if (!MongoDBConnection.instance) {
			MongoDBConnection.instance = new MongoDBConnection();
		}
		return MongoDBConnection.instance;
	}

	public async connect(): Promise<void> {
		if (this.isConnected) {
			logger.info('MongoDB connection already established');
			return;
		}

		const mongoDBConf: MongoDBConfig = constants.dbLayer.mongodb;
		const { uri, ...rest } = mongoDBConf;

		try {
			this.validateConfig(mongoDBConf);
			await mongoose.connect(uri, rest);
			logger.info('Connected to MongoDB successfully');
			this.isConnected = true;
		} catch (error) {
			logger.error('Failed to connect to MongoDB:', error);
			throw error;
		}
	}

	private async reconnect(maxAttempts: number = 5, delay: number = 5000): Promise<void> {
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				await this.connect();
				return;
			} catch (error) {
				logger.error(`Reconnection attempt ${attempt} failed:`, error);
				if (attempt === maxAttempts) {
					throw new MongoConnectionError('Max reconnection attempts reached', error);
				}
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	private validateConfig(config: MongoDBConfig): void {
		if (!config.uri) {
			throw new Error('MongoDB URI is required');
		}
		// Add more validation as needed
	}

	private setupConnectionListeners(): void {
		mongoose.connection.on('disconnected', () => {
			logger.info('Lost MongoDB connection');
			this.isConnected = false;
			this.reconnect().catch(logger.error);
		});

		mongoose.connection.on('error', (error) => {
			logger.error('MongoDB connection error:', error);
		});
	}

	public async cleanup(): Promise<void> {
		if (!this.isConnected) {
			logger.info('MongoDB connection already closed');
			return;
		}

		try {
			await mongoose.connection.close();
			logger.info('Disconnected from MongoDB successfully');
			this.isConnected = false;
		} catch (error) {
			logger.error('Failed to disconnect from MongoDB:', error);
			throw error;
		}
	}

	public getIsConnected(): boolean {
		return this.isConnected;
	}
}

class MongoConnectionError extends Error {
	constructor(
		message: string,
		public originalError?: any,
	) {
		super(message);
		this.name = 'MongoConnectionError';
	}
}

const mongoDbConnection = MongoDBConnection.getInstance();

export default mongoDbConnection;
