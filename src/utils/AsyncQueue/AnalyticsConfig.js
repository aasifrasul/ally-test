class AnalyticsConfig {
	constructor(options = {}) {
		// Batch settings
		this.MAX_BATCH_SIZE = options.batchSize || 10;
		this.IDLE_THRESHOLD = options.batchingInterval || 30000; // ms

		// API settings
		this.API_ENDPOINT = options.apiEndpoint || 'https://api.example.com/analytics';
		this.API_HEADERS = options.headers || { 'Content-Type': 'application/json' };

		// Retry settings
		this.MAX_RETRIES = options.retryCount || 3;
		this.RETRY_STRATEGY = options.retryStrategy || 'exponential'; // 'linear' or 'exponential'
		this.INITIAL_RETRY_DELAY = options.retryDelay || 3000; // ms

		// Storage settings
		this.STORAGE_TYPE = options.storageType || 'indexedDB'; // Web Workers can't access localStorage directly
		this.STORAGE_KEY = options.storageKey || 'analytics_events';
		this.STORAGE_QUOTA = options.storageQuota || 1024 * 1024; // 1MB default

		// Other settings
		this.RETRY_ON_RELOAD = true; // Always true in worker context
		this.FAILED_EVENT_STRATEGY = options.failedEventStrategy || 'keep'; // 'discard' or 'keep'

		// Worker-specific settings
		this.USE_SERVICE_WORKER = options.useServiceWorker !== false; // Default to true
	}
}
