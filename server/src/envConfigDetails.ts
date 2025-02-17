import { config } from 'dotenv';

import { pathRootDir } from './paths';

config({ path: `${pathRootDir}/.env` });

const { NODE_PORT: port, NODE_HOST: host } = process.env;

export { port, host };
