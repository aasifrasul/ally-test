import { config } from 'dotenv';

import { pathRootDir } from './paths';

config({ path: `${pathRootDir}/.env` });

const { NODE_PORT: port, NODE_HOST: host, REDIS_URL, REDIS_RETRY_DELAY, REDIS_MAX_RETRIES, ALLOWED_ORIGINS } = process.env;

export { port, host, REDIS_URL, REDIS_RETRY_DELAY, REDIS_MAX_RETRIES, ALLOWED_ORIGINS };

export const isCurrentEnvProd: boolean = 	 (process.env.NODE_ENV === 'production') ;