import { createLogger, format, transports, Logger } from 'winston';

const lineFormat = format((info, opts) => {
	const stack = new Error().stack;
	if (stack) {
		const lines = stack.split('\n');
		if (lines.length >= 4) {
			// Adjust based on where you call logger from
			const relevantLine = lines[3]; // Adjust the index as needed
			const match = /at .* \((.*):(\d+):\d+\)/.exec(relevantLine);
			if (match) {
				info.line = match[2];
			}
		}
	}
	return info;
});

export const logger: Logger = createLogger({
	level: 'info',
	format: format.combine(
		format.timestamp({
			format: 'YYYY-MM-DD HH:mm:ss',
		}),
		format.errors({ stack: true }),
		format.splat(),
		lineFormat(), // Add the custom line format here
		format.json(),
	),
	defaultMeta: { service: 'user-service' },
	transports: [
		new transports.File({ filename: 'error.log', level: 'error' }),
		new transports.File({ filename: 'combined.log' }),
	],
});

logger.add(
	new transports.Console({
		format: format.combine(
			format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			format.printf(({ timestamp, level, message, line, ...meta }) => {
				return `${timestamp} ${level}: ${message} ${line ? `(line ${line})` : ''} ${
					Object.keys(meta).length ? JSON.stringify(meta) : ''
				}`;
			}),
		),
	}),
);
