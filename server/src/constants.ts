import { config } from 'dotenv';

import { pathRootDir } from './paths';

import {
	DBType,
	RedisConfig,
	MongoDBConfig,
	PostgresConfig,
	MySQLConfig,
	OracleConfig,
} from './types';

config({ path: `${pathRootDir}/.env` });

const { REDIS_MAX_RETRIES, REDIS_RETRY_DELAY } = process.env;

interface Constants {
	cachingLayer: {
		enabled: boolean;
		redisConfig: RedisConfig;
	};
	dbLayer: {
		currentDB: DBType;
		mongodb: MongoDBConfig;
		postgres: PostgresConfig;
		mysql: MySQLConfig;
		oracle: OracleConfig;
	};
}

export const constants: Constants = {
	cachingLayer: {
		enabled: true,
		redisConfig: {
			host: 'localhost',
			port: 6379,
			MAX_RETRIES: Number(REDIS_MAX_RETRIES),
			RETRY_DELAY: Number(REDIS_RETRY_DELAY),
		},
	},
	dbLayer: {
		currentDB: DBType.MONGODB,
		mongodb: {
			uri: 'mongodb://localhost:27017',
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
		},
		postgres: {
			user: 'postgres',
			host: 'localhost',
			database: 'postgres',
			password: 'test',
			port: 5432,
		},
		mysql: {
			user: 'test',
			password: 'test',
			host: '127.0.0.1',
			port: 3306,
			database: 'test',
			waitForConnections: true,
			connectionLimit: 10,
			maxIdle: 10,
			idleTimeout: 60000,
			queueLimit: 0,
			enableKeepAlive: true,
			keepAliveInitialDelay: 0,
		},
		oracle: {
			user: 'zportal',
			password: 'zportal',
			connectString: 'dft11-t13-adb01.lab.nordigy.ru:1521/devf13ams_db',
			poolMin: 10,
			poolMax: 50,
			poolIncrement: 5,
			poolTimeout: 60,
		},
	},
};