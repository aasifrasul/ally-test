import packages from '../package.json' assert { type: 'json' };

const publicPath = process.env.NODE_ENV === 'production' ? '' : '/public/';
const DEV = process.env.NODE_ENV !== 'production';
const SENTRY_VERSION = '2.1.2';
const SENTRY_KEY = '';
const SENTRY_URL = '';
const APP_NAME = packages.name;

export { publicPath, APP_NAME, SENTRY_VERSION, SENTRY_KEY, SENTRY_URL, DEV };
