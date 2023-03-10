module.exports = {
	publicPath:
		process.env.NODE_ENV === 'production' ? '' : '/public/',
	APP_NAME: require('../package.json').name,
	SENTRY_VERSION: '2.1.2',
	SENTRY_KEY: '',
	SENTRY_URL: '',
	DEV: process.env.NODE_ENV !== 'production',
};
