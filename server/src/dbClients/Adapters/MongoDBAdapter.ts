import mongoose from 'mongoose';

import { MongoDBConnection } from '../MongoDBConnection';
import { IDBAdapter } from './types';

export class MongoDBAdapter implements IDBAdapter {
	constructor(private connection: MongoDBConnection) {}

	private getDB() {
		const db = this.connection.getDB();
		if (!db) throw new Error('MongoDB not connected');
		return db;
	}

	async find<T>(collection: string, filter: any): Promise<T[]> {
		const db = this.getDB();
		return (await db.collection(collection).find(filter).toArray()) as T[];
	}

	async findOne<T>(collection: string, filter: any): Promise<T | null> {
		const db = this.getDB();
		return (await db.collection(collection).findOne(filter)) as T | null;
	}

	async insert<T>(collection: string, data: any): Promise<T> {
		const db = this.getDB();
		const result = await db.collection(collection).insertOne(data);
		return { ...data, id: result.insertedId } as T;
	}

	async update(collection: string, filter: any, data: any): Promise<number> {
		const db = this.getDB();
		const result = await db.collection(collection).updateMany(filter, { $set: data });
		return result.modifiedCount;
	}

	async delete(collection: string, filter: any): Promise<number> {
		const db = this.getDB();
		const result = await db.collection(collection).deleteMany(filter);
		return result.deletedCount;
	}

	async checkHealth(): Promise<boolean> {
		return await this.connection.checkHealth();
	}

	async cleanup(): Promise<void> {
		await this.connection.cleanup();
	}
}
