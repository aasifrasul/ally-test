export enum LogLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
}

interface LoggerOptions {
	level?: LogLevel;
	enabled?: boolean;
	prefix?: string;
}

let globalLoggerOptions: LoggerOptions = {}; // Global options variable

export class Logger {
	private level: LogLevel;
	private enabled: boolean;
	private prefix: string;
	private readonly levelPriority: Record<LogLevel, number> = {
		[LogLevel.DEBUG]: 0,
		[LogLevel.INFO]: 1,
		[LogLevel.WARN]: 2,
		[LogLevel.ERROR]: 3,
	};

	constructor(name: string, options: LoggerOptions = {}) {
		this.level = options.level || LogLevel.INFO;
		this.enabled = options.enabled ?? process.env.NODE_ENV !== 'production';
		this.prefix = options.prefix || name;
	}

	private shouldLog(level: LogLevel): boolean {
		return this.enabled && this.levelPriority[level] >= this.levelPriority[this.level];
	}

	private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${level.toUpperCase()}] [${this.prefix}] ${message}`;
	}

	debug(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.DEBUG)) {
			console.debug(this.formatMessage(LogLevel.DEBUG, message), ...args);
		}
	}

	info(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.INFO)) {
			console.info(this.formatMessage(LogLevel.INFO, message), ...args);
		}
	}

	warn(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.WARN)) {
			console.warn(this.formatMessage(LogLevel.WARN, message), ...args);
		}
	}

	error(message: string, ...args: any[]): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			console.error(this.formatMessage(LogLevel.ERROR, message), ...args);
		}
	}

	errorWithObject(message: string, error: Error): void {
		if (this.shouldLog(LogLevel.ERROR)) {
			console.error(this.formatMessage(LogLevel.ERROR, message), error);
		}
	}
}

export const createLogger = (name: string, options?: LoggerOptions): Logger => {
	return new Logger(name, options);
};

// Optional: Create a global logger configuration
export const configureGlobalLogger = (options: LoggerOptions): void => {
	globalLoggerOptions = {
		...globalLoggerOptions,
		...options,
	};
};

/*

// Usage example:
const logger = createLogger('MyComponent', {
	level: 'debug',
	enabled: process.env.NODE_ENV !== 'production',
});
*/
