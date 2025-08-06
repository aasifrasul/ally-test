import { Logger, LogLevel, createLogger } from '../Logger';

describe('Logger', () => {
	let consoleSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleSpy = jest.spyOn(console, 'info').mockImplementation();
		jest.spyOn(console, 'debug').mockImplementation();
		jest.spyOn(console, 'warn').mockImplementation();
		jest.spyOn(console, 'error').mockImplementation();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should create a logger with default options', () => {
		const logger = createLogger('TestLogger');
		expect(logger).toBeInstanceOf(Logger);
	});

	it('should respect log level priority', () => {
		const logger = createLogger('TestLogger', { level: LogLevel.WARN });
		logger.debug('Debug message');
		logger.info('Info message');
		logger.warn('Warn message');
		logger.error('Error message');

		expect(console.debug).not.toHaveBeenCalled();
		expect(console.info).not.toHaveBeenCalled();
		expect(console.warn).toHaveBeenCalled();
		expect(console.error).toHaveBeenCalled();
	});

	it('should format messages correctly', () => {
		const logger = createLogger('TestLogger');
		logger.info('Test message');

		const loggedMessage = consoleSpy.mock.calls[0][0] as string;
		expect(loggedMessage).toMatch(
			/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[TestLogger\] Test message$/,
		);
	});

	it('should handle additional arguments', () => {
		const logger = createLogger('TestLogger');
		logger.info('Test message with %s and %d', 'string', 42);

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('Test message with %s and %d'),
			'string',
			42,
		);
	});

	it('should respect the enabled option', () => {
		const logger = createLogger('TestLogger', { enabled: false });
		logger.info('This should not be logged');

		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('should use custom prefix if provided', () => {
		const logger = createLogger('TestLogger', { prefix: 'CustomPrefix' });
		logger.info('Test message');

		const loggedMessage = consoleSpy.mock.calls[0][0] as string;
		expect(loggedMessage).toContain('[CustomPrefix]');
	});

	it('should log all levels when set to DEBUG', () => {
		const logger = createLogger('TestLogger', { level: LogLevel.DEBUG });
		logger.debug('Debug message');
		logger.info('Info message');
		logger.warn('Warn message');
		logger.error('Error message');

		expect(console.debug).toHaveBeenCalled();
		expect(console.info).toHaveBeenCalled();
		expect(console.warn).toHaveBeenCalled();
		expect(console.error).toHaveBeenCalled();
	});
});
