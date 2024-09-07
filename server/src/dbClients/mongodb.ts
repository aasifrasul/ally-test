import mongoose from 'mongoose';

import { MongoDBConfig } from '../types';

import { constants } from '../constants';

class MongoDbConnection {
	private static instance: MongoDbConnection;
	private isConnected: boolean = false;

	private constructor() {}

	public static getInstance(): MongoDbConnection {
		if (!MongoDbConnection.instance) {
			MongoDbConnection.instance = new MongoDbConnection();
			MongoDbConnection.instance.connect();
		}
		return MongoDbConnection.instance;
	}

	public async connect(): Promise<void> {
		if (this.isConnected) {
			console.log('MongoDB connection already established');
			return;
		}

		const { uri, ...rest }: MongoDBConfig = constants.dbLayer.mongodb;

		try {
			await mongoose.connect(uri, rest);
			console.log('Connected to MongoDB successfully');
			this.isConnected = true;
		} catch (error) {
			console.error('Failed to connect to MongoDB:', error);
			throw error;
		}
	}

	public async disconnect(): Promise<void> {
		if (!this.isConnected) {
			console.log('MongoDB connection already closed');
			return;
		}

		try {
			await mongoose.connection.close();
			console.log('Disconnected from MongoDB successfully');
			this.isConnected = false;
		} catch (error) {
			console.error('Failed to disconnect from MongoDB:', error);
			throw error;
		}
	}

	public getIsConnected(): boolean {
		return this.isConnected;
	}
}

const mongoDbConnection = MongoDbConnection.getInstance();

export default mongoDbConnection;
