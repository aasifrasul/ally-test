import mongoose from 'mongoose';
import { MongoDBConfig } from '../types';
import { constants } from '../constants';
import { logger } from '../Logger';

class MongoDBConnection {
	private static instance: MongoDBConnection;
	private isConnected: boolean = false;

	private constructor() {
		logger.info('MongoDB connection manager initialized.');
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
			await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
			await mongoose.disconnect();
			return true;
		} catch (error) {
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

const mongoDbConnection = MongoDBConnection.getInstance();

export default mongoDbConnection;
