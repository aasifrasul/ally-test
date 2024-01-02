const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
	return `${timestamp} [${label}] ${level}: ${message}`;
});

const filename = module.filename.split('/').slice(-1);

const logger = createLogger({
	level: 'info',
	format: combine(label({ label: filename }), timestamp(), myFormat, format.json()),
	defaultMeta: { service: 'ally-test' },
	transports: [
		//
		// - Write to all logs with level `info` and below to `combined.log`
		// - Write all logs error (and below) to `error.log`.
		//
		new transports.File({ filename: 'error.log', level: 'error' }),
		new transports.File({ filename: 'combined.log' }),
	],
});

logger.add(
	new transports.Console({
		format: format.simple(),
	}),
);

module.exports = {
	logger,
};
