import { config } from 'dotenv';

import { pathRootDir } from './paths';

config({ path: `${pathRootDir}/.env` });

const {
	NODE_PORT: port,
	NODE_HOST: host,
	NODE_ENV,
	REDIS_URL,
	REDIS_RETRY_DELAY,
	REDIS_MAX_RETRIES,
	ALLOWED_ORIGINS,
	JWT_SECRET = 'your-secret-key',
	JWT_EXPIRES_IN = '24h',
} = process.env;

export {
	port,
	host,
	NODE_ENV,
	REDIS_URL,
	REDIS_RETRY_DELAY,
	REDIS_MAX_RETRIES,
	ALLOWED_ORIGINS,
	JWT_SECRET,
	JWT_EXPIRES_IN,
};

export const isCurrentEnvProd: boolean = process.env.NODE_ENV === 'production';
