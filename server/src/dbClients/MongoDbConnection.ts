import mongoose from 'mongoose';
import { MongoDBConfig, DBType } from '../types';
import { constants } from '../constants';
import { logger } from '../Logger';

class MongoDBConnection {
	private static instance: MongoDBConnection;
	private isConnected: boolean = false;

	private constructor() {
		logger.info('MongoDB connection manager initialized.');
	}

	public static getInstance(): MongoDBConnection | null {
		if (!MongoDBConnection.instance) {
			MongoDBConnection.checkForValidDBType();
			MongoDBConnection.instance = new MongoDBConnection();
		}
		return MongoDBConnection.instance;
	}

	private static checkForValidDBType(): void {
		if (constants.dbLayer.currentDB !== DBType.MONGODB) {
			throw new Error('Please use correct Db Type');
		}
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

			// Check if MongoDB is available before attempting to connect
			const isAvailable = await this.checkMongoDBAvailability(uri);
			if (!isAvailable) {
				logger.warn('MongoDB is not available. Skipping connection attempt.');
				return;
			}

			await mongoose.connect(uri, rest);
			logger.info('Connected to MongoDB successfully');
			this.isConnected = true;
		} catch (error) {
			logger.error('Failed to connect to MongoDB:', error);
			this.isConnected = false;
		}
	}

	private async checkMongoDBAvailability(uri: string): Promise<boolean> {
		try {
			// Parse connection string to extract server details
			const parsedUri = new URL(uri.replace('mongodb://', 'http://'));
			const host = parsedUri.hostname;
			const port = parsedUri.port || '27017';

			// Use TCP socket to check if MongoDB server is listening
			const net = require('net');
			const socket = new net.Socket();

			return new Promise<boolean>((resolve) => {
				// Set a timeout for the connection attempt
				socket.setTimeout(3000);

				socket.on('connect', () => {
					socket.end();
					resolve(true);
				});

				socket.on('timeout', () => {
					socket.destroy();
					resolve(false);
				});

				socket.on('error', () => {
					resolve(false);
				});

				// Attempt to connect to the MongoDB port
				socket.connect(parseInt(port), host);
			});
		} catch (error) {
			logger.debug('Error checking MongoDB availability:', error);
			return false;
		}
	}

	private validateConfig(config: MongoDBConfig): void {
		if (!config.uri) {
			throw new Error('MongoDB URI is required');
		}
		// Add more validation as needed
	}

	public async cleanup(): Promise<void> {
		if (!this.isConnected) {
			logger.info('No active MongoDB connection to clean up.');
			return;
		}

		try {
			await mongoose.disconnect();
			logger.info('Disconnected from MongoDB successfully');
			this.isConnected = false;
		} catch (error) {
			logger.error('Failed to disconnect from MongoDB:', error);
		}
	}

	public getIsConnected(): boolean {
		return this.isConnected;
	}
}

export default MongoDBConnection;
