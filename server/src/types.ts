enum DBType {
	ORACLE = 'oracle',
	POSTGRES = 'postgres',
	MYSQL = 'mysql',
	MONGODB = 'mongodb',
}

interface RedisConfig {
	host: string;
	port: number;
	MAX_RETRIES?: number;
	RETRY_DELAY?: number;
}

interface MongoDBConfig {
	uri: string;
	maxPoolSize: number;
	serverSelectionTimeoutMS: number;
	socketTimeoutMS: number;
}

interface PostgresConfig {
	user: string;
	host: string;
	database: string;
	password: string;
	port: number;
}

interface MySQLConfig {
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

interface OracleConfig {
	user: string;
	password: string;
	connectString: string;
	poolMin: number;
	poolMax: number;
	poolIncrement: number;
	poolTimeout: number;
}

export { DBType, RedisConfig, MongoDBConfig, PostgresConfig, MySQLConfig, OracleConfig };
