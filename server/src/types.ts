import { Document } from 'mongoose';

export interface IUser extends Document {
	id?: string;
	name: string;
	email: string;
	age?: number;
	password?: string;
}

export interface IProduct extends Document {
	name: string;
	category: string;
	id: string;
}

export enum DBType {
	ORACLE = 'oracle',
	POSTGRES = 'postgres',
	MYSQL = 'mysql',
	MONGODB = 'mongodb',
}

export interface RedisConfig {
	url?: string;
	host: string;
	port: number;
	MAX_RETRIES?: number;
	RETRY_DELAY?: number;
}

export interface MongoDBConfig {
	uri: string;
	maxPoolSize: number;
	serverSelectionTimeoutMS: number;
	socketTimeoutMS: number;
	connectTimeoutMS: number;
	//bufferMaxEntries: number;
	//bufferCommands: boolean;
}

export interface PostgresConfig {
	user: string;
	host: string;
	database: string;
	password: string;
	port: number;
	maxConnections: number;
	connectionTimeoutMillis: number;
}

export interface MySQLConfig {
	user: string;
	password: string;
	host: string;
	port: number;
	database: string;
	waitForConnections: boolean;
	connectionLimit: number;
	maxIdle: number;
	idleTimeout: number;
	queueLimit: number;
	enableKeepAlive: boolean;
	keepAliveInitialDelay: number;
}

export interface OracleConfig {
	user: string;
	password: string;
	connectString: string;
	poolMin: number;
	poolMax: number;
	poolIncrement: number;
	poolTimeout: number;
}

export type AuthenticatedRequest = Request & {
	user?: {
		id: string;
		email: string;
		role?: string;
		permissions?: string[];
		sessionId?: string;
		iat?: number;
		exp?: number;
	};
	cookies?: Record<string, string>;
};

export type UserResult =
	| {
			success: true;
			message?: string;
			user: IUser;
	  }
	| {
			success: false;
			message?: string;
	  };

export type DeleteResult = UserResult & {
	id: string;
};

export interface TokenPayload {
	id: string;
	email: string;
	role?: string;
	permissions?: string[];
	sessionId?: string;
	type: 'access' | 'refresh';
	iat?: number;
	exp?: number;
}
