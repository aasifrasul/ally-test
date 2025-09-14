import mongoose from 'mongoose';
import net from 'net';

import { MongoDBConfig, DBType } from '../types';
import { constants } from '../constants';
import { logger } from '../Logger';

export class MongoDBConnection {
	private static instance: MongoDBConnection;
	private connectionPromise: Promise<void> | null = null;

	private constructor() {
		logger.info('MongoDB connection manager initialized.');
	}

	public static getInstance(): MongoDBConnection | null {
		if (constants.dbLayer.currentDB !== DBType.MONGODB) return null;

		if (!MongoDBConnection.instance) {
			MongoDBConnection.instance = new MongoDBConnection();
		}
		return MongoDBConnection.instance;
	}

	public async connect(): Promise<void> {
		// If connection is already in progress, wait for it
		if (this.connectionPromise) {
			return this.connectionPromise;
		}

		// If already connected, return immediately
		if (mongoose.connection.readyState === 1) {
			logger.info('MongoDB connection already established');
			return;
		}

		// Create a new connection promise
		this.connectionPromise = this.performConnection();

		try {
			await this.connectionPromise;
		} finally {
			// Clear the promise after completion (success or failure)
			this.connectionPromise = null;
		}
	}

	private async performConnection(): Promise<void> {
		try {
			const mongoDBConf: MongoDBConfig = constants.dbLayer.mongodb;
			const { uri, ...rest } = mongoDBConf;

			this.validateConfig(mongoDBConf);

			// Check if MongoDB is available before attempting to connect
			const isAvailable = await this.checkMongoDBAvailability(uri);
			if (!isAvailable) {
				logger.error('MongoDB server is not available');
				return;
			}

			await mongoose.connect(uri, rest);

			// Set up connection event listeners
			mongoose.connection.on('connected', () => {
				logger.info('MongoDB connected successfully');
			});

			mongoose.connection.on('error', (error) => {
				logger.error('MongoDB connection error:', error);
			});

			mongoose.connection.on('disconnected', () => {
				logger.warn('MongoDB disconnected');
			});

			logger.info('MongoDB connection established');
		} catch (error) {
			logger.error('Failed to connect to MongoDB:', error);
			throw error;
		}
	}

	private async checkMongoDBAvailability(uri: string): Promise<boolean> {
		try {
			// Handle both mongodb:// and mongodb+srv:// URIs
			const match = uri.match(/mongodb(?:\+srv)?:\/\/(?:[^@]+@)?([^\/]+)/);
			if (!match) return false;

			const hostPort = match[1].split(':');
			const host = hostPort[0];
			const port = hostPort[1] || '27017';

			const socket = new net.Socket();

			return new Promise<boolean>((resolve) => {
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
	}

	public async cleanup(): Promise<void> {
		if (mongoose.connection.readyState === 0) {
			logger.info('No active MongoDB connection to clean up.');
			return;
		}

		try {
			await mongoose.disconnect();
			logger.info('Disconnected from MongoDB successfully');
		} catch (error) {
			logger.error('Failed to disconnect from MongoDB:', error);
		}
	}

	public getIsConnected(): boolean {
		return mongoose.connection.readyState === 1;
	}

	// Initialize connection at startup
	public static async initialize(): Promise<void> {
		const instance = MongoDBConnection.getInstance();
		await instance?.connect();
	}
}
