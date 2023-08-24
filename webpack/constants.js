import fs from 'fs';
import path from 'path';

import { pathRootDir } from '../server/paths.js';

const packageJson = JSON.parse(
	fs.readFileSync(path.resolve(pathRootDir, 'package.json'), 'utf8')
);

export const publicPath = process.env.NODE_ENV === 'production' ? '' : '/public/';
export const APP_NAME = packageJson.name;
export const SENTRY_VERSION = '2.1.2';
export const SENTRY_KEY = '';
export const SENTRY_URL = '';
export const DEV = process.env.NODE_ENV !== 'production';
