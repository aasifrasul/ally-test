import { createLogger, format, transports, Logger } from 'winston';

// Create a logger instance with the specified configuration
const logger: Logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss',
		}),
		format.errors({ stack: true }),
		format.splat(),
		format.json(),
	),
	defaultMeta: { service: 'user-service' },
	transports: [
		// Write all logs with level 'error' and below to 'error.log'
		new transports.File({ filename: 'error.log', level: 'error' }),
		// Write all logs to 'combined.log'
		new transports.File({ filename: 'combined.log' }),
	],
});

// Add a console transport for logging to the console
logger.add(
	new transports.Console({
		format: format.simple(),
	}),
);

export { logger };
