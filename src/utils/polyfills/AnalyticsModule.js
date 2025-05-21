/**
`
Design an Analytics Module that collects events, batches them, and sends them to a server via an API. 
The module should store events in localStorage or IndexedDB when the API fails or if the page reloads. 
The system should send batches either when a maximum batch size is reached or after a certain idle time.
`

Clarifying Questions:
What is the expected volume of events? (events per minute/hour)

Do we need to have retry? What should be the strategy? (linear, exponential backoff)
maximum number of retries before giving up?

How do we handle high-frequency events? can cause performance issues? throttling?
Should operations be performed in a web worker to avoid blocking the main thread?

Should different types of failures (network errors vs server errors) have different retry strategies?

How long should we retain events in storage if they can't be sent?
How should we handle storage quota exceeded errors?

Are there any privacy concerns or regulations (GDPR, CCPA) that need to be addressed in how we collect and store data?

Do we need to handle offline/online transitions?
What happens when the user navigates away from the page during a send operation?
One option could be handing off to ServiceWorker.
Are there any rate limits on the API we need to consider?


Analytics Module
├── trackEvent(eventType, eventData)
├── trackPageView(pageData)
├── trackClick(element, clickData)
│
├── Event Queue Manager
│   ├── enqueue(event)            // Add new event to queue
│   ├── dequeue()                 // Remove event from queue
│   ├── size()                    // Current queue size
│   ├── isEmpty()                 // Check if queue is empty
│   ├── peek()                    // View next event without removing
│   └── getEvents(count)          // Get multiple events for batching
│
├── Storage Manager
│   ├── saveEvents(events)        // Save events to localStorage/IndexedDB
│   ├── loadEvents()              // Load saved events on startup
│   ├── clearEvents(eventIds)     // Remove events after successful send
│   ├── saveRetryInfo(batchId, retryInfo)  // Save retry metadata
│   └── getRetryBatches()         // Get batches pending retry
│
├── Batch Processor
│   ├── createBatch(events)       // Create a new batch from events
│   ├── processBatch(batch)       // Process and send a batch
│   ├── attemptProcessing()       // Attempt to process events in the queue
│   ├── scheduleBatch()           // Schedule based on time/size thresholds
│   ├── prioritizeBatches()       // Order batches by priority if needed
│   ├── handleBrowserUnload()     // Save data when browser relaods.
│   └── flush()                   // Force send all pending events
│
├── API Client
│   ├── sendBatch(batch)          // Send batch to server
│   ├── checkConnectivity()       // Check network status
│   └── handleResponse(response)  // Process API response
│
├── Retry Manager
│   ├── scheduleRetry(batch, attempt)  // Schedule with backoff
│   ├── processRetries()          // Process pending retries
│   ├── updateRetryStatus(batchId, status)  // Update retry metadata
│   └── handleMaxRetries(batch)   // Process batches that hit max retries
│
└── Configuration
	├── MAX_BATCH_SIZE            // Maximum events per batch
	├── IDLE_THRESHOLD            // Time before auto-sending
	├── MAX_RETRIES               // Maximum retry attempts
	├── RETRY_STRATEGY            // Linear or exponential backoff
	├── STORAGE_QUOTA             // Maximum storage to use
	├── RETRY_ON_RELOAD           // Whether to retry on page reload
	└── FAILED_EVENT_STRATEGY     // What to do after max retries
*/


/**
 * Analytics Module
 *
 * Collects events, batches them, and sends them to a server via an API.
 * Handles failures by storing events in localStorage/IndexedDB and retrying.
 */


/**
 * Event Queue Manager
 * Manages the queue of events to be processed
 */
class EventQueueManager {
	constructor() {
		this.map = new Map();
		this.upperLimit = 0;
		this.lowerLimit = 0;
	}

	enqueue(item) {
		const enhancedItem = {
			...item,
			id: `event_${++this.upperLimit}_${Date.now()}`,
			timestamp: item.timestamp || new Date().toISOString(),
			queuedAt: Date.now()
		};
		this.map.set(this.upperLimit, enhancedItem);
	}

	prequeue(item) {
		const enhancedItem = {
			...item,
			id: `event_${this.upperLimit}_${Date.now()}`,
			timestamp: event.timestamp || new Date().toISOString(),
			queuedAt: Date.now()
		};
		this.map.set(this.lowerLimit--, item);
	}

	dequeue() {
		if (this.isEmpty()) {
			return null;
		}
		const key = ++this.lowerLimit;
		const result = this.map.get(key);
		this.map.delete(key);
		return result;
	}

	/**
	 * Get multiple events for batching
	 * @param {number} count - Number of events to retrieve
	 * @returns {Array} - Array of events
	 */
	getEvents(count) {
		const events = [];
		const actualCount = Math.min(count, this.size);
    
		for (let i = 0; i < actualCount; i++) {
			events.push(this.dequeue());
		}
    
		return events;
	}

	peek() {
		if (this.isEmpty()) return null;
		return this.map.get(this.upperLimit);
	}

	isEmpty() {
		return this.map.size === 0;
	}

	size() {
		return this.map.size;
	}

	clear() {
		this.map.clear();
	}
}

/**
 * Configuration for the Analytics Module
 */
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
		this.STORAGE_TYPE = options.storageType || 'localStorage'; // 'localStorage' or 'indexedDB'
		this.STORAGE_KEY = options.storageKey || 'analytics_events';
		this.STORAGE_QUOTA = options.storageQuota || 1024 * 1024; // 1MB default
    
		// Other settings
		this.RETRY_ON_RELOAD = options.retryOnReload !== false; // default true
		this.FAILED_EVENT_STRATEGY = options.failedEventStrategy || 'discard'; // 'discard' or 'keep'
	}
}

/**
 * Storage Manager
 * Manages persistence of events to localStorage or IndexedDB
 */
class StorageManager {
	constructor(config) {
		this.config = config;
		this.dbName = 'analyticsDb';
		this.storeName = 'events';
		this.retryInfoStoreName = 'retryInfo';
		this.isDbInitialized = false;
		this.RETRY_STORAGE_KEY = `${this.config.STORAGE_KEY}_retry`;
	}

	/**
	 * Save events to storage
	 * @param {Array} events - Events to save
	 * @returns {Promise}
	 */
	async saveEvents(events) {
		if (!events || events.length === 0) return;

		try {
			if (this.config.STORAGE_TYPE === 'localStorage') {
				return this._saveToLocalStorage(events);
			} else if (this.config.STORAGE_TYPE === 'indexedDB') {
				return this._saveToIndexedDB(events);
			}
		} catch (error) {
			console.error('Failed to save events to storage:', error);
		}
	}

	/**
	 * Load saved events from storage
	 * @returns {Promise<Array>} - Array of saved events
	 */
	async loadEvents() {
		try {
			if (this.config.STORAGE_TYPE === 'localStorage') {
				return this._loadFromLocalStorage();
			} else if (this.config.STORAGE_TYPE === 'indexedDB') {
				return this._loadFromIndexedDB();
			}
		} catch (error) {
			console.error('Failed to load events from storage:', error);
			return [];
		}
	}

	/**
	 * Clear specific events from storage after successful send
	 * @param {Array} eventIds - IDs of events to clear
	 * @returns {Promise}
	 */
	async clearEvents(eventIds) {
		try {
			if (this.config.STORAGE_TYPE === 'localStorage') {
				return this._clearEventsFromLocalStorage(eventIds);
			} else if (this.config.STORAGE_TYPE === 'indexedDB') {
				return this._clearEventsFromIndexedDB(eventIds);
			}
		} catch (error) {
			console.error('Failed to clear events from storage:', error);
		}
	}

	/**
	 * Save retry information for a batch
	 * @param {string} batchId - ID of the batch
	 * @param {Object} retryInfo - Retry metadata
	 * @returns {Promise}
	 */
	async saveRetryInfo(batchId, retryInfo) {
		try {
			if (this.config.STORAGE_TYPE === 'localStorage') {
				return this._saveRetryInfoToLocalStorage(batchId, retryInfo);
			} else if (this.config.STORAGE_TYPE === 'indexedDB') {
				return this._saveRetryInfoToIndexedDB(batchId, retryInfo);
			}
		} catch (error) {
			console.error('Failed to save retry info:', error);
		}
	}

	/**
	 * Update retry status in storage
	 * @param {string} batchId - ID of batch
	 * @param {string} status - New status
	 */
	async updateRetryStatus(batchId, status) {
		const retryBatches = await this.getRetryBatches();
		const retryInfo = retryBatches[batchId];
    
		if (retryInfo) {
			retryInfo.status = status;
			retryInfo.updatedAt = Date.now();
      
			await this.saveRetryInfo(batchId, retryInfo);
		}
	}

	/**
	 * Get batches pending retry
	 * @returns {Promise<Array>} - Array of batches pending retry
	 */
	async getRetryBatches() {
		try {
			if (this.config.STORAGE_TYPE === 'localStorage') {
				return this._getRetryBatchesFromLocalStorage();
			} else if (this.config.STORAGE_TYPE === 'indexedDB') {
				return this._getRetryBatchesFromIndexedDB();
			}
		} catch (error) {
			console.error('Failed to get retry batches:', error);
			return [];
		}
	}

	/**
	 * Clear all stored data
	 * @returns {Promise}
	 */
	async clearAllData() {
		try {
			if (this.config.STORAGE_TYPE === 'localStorage') {
				localStorage.removeItem(this.config.STORAGE_KEY);
				localStorage.removeItem(this.RETRY_STORAGE_KEY);
			} else if (this.config.STORAGE_TYPE === 'indexedDB') {
				return this._clearIndexedDB();
			}
		} catch (error) {
			console.error('Failed to clear storage:', error);
		}
	}

	// Private methods for localStorage implementation
	_saveToLocalStorage(events) {
		const existingData = this._loadFromLocalStorage();
		const updatedData = [...existingData, ...events];
    
		// Check storage quota
		const dataSize = JSON.stringify(updatedData).length;
		if (dataSize > this.config.STORAGE_QUOTA) {
			console.warn('Storage quota exceeded, removing oldest events');
			// Remove oldest events until under quota
			while (JSON.stringify(updatedData).length > this.config.STORAGE_QUOTA && updatedData.length > 0) {
				updatedData.shift(); // Remove oldest event
			}
		}
    
		localStorage.setItem(this.config.STORAGE_KEY, JSON.stringify(updatedData));
	}

	_loadFromLocalStorage() {
		const data = localStorage.getItem(this.config.STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	}

	_clearEventsFromLocalStorage(eventIds) {
		const events = this._loadFromLocalStorage();
		const filteredEvents = events.filter(event => !eventIds.includes(event.id));
		localStorage.setItem(this.config.STORAGE_KEY, JSON.stringify(filteredEvents));
	}

	_saveRetryInfoToLocalStorage(batchId, retryInfo) {
		const retryData = this._getRetryBatchesFromLocalStorage()
    
		retryData[batchId] = retryInfo;
		localStorage.setItem(key, JSON.stringify(retryData));
	}

	_getRetryBatchesFromLocalStorage() {
		const data = localStorage.getItem(this.RETRY_STORAGE_KEY);
		return data ? JSON.parse(data) : {};
	}

	// Private methods for IndexedDB implementation
	async _initIndexedDB() {
		if (this.isDbInitialized) return;

		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, 1);
      
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
        
				// Create object stores if they don't exist
				if (!db.objectStoreNames.contains(this.storeName)) {
					db.createObjectStore(this.storeName, { keyPath: 'id' });
				}
        
				if (!db.objectStoreNames.contains(this.retryInfoStoreName)) {
					db.createObjectStore(this.retryInfoStoreName, { keyPath: 'batchId' });
				}
			};
      
			request.onsuccess = (event) => {
				this.db = event.target.result;
				this.isDbInitialized = true;
				resolve();
			};
      
			request.onerror = (event) => {
				console.error('IndexedDB error:', event.target.error);
				reject(event.target.error);
			};
		});
	}

	async _saveToIndexedDB(events) {
		await this._initIndexedDB();
    
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
      
			let completed = 0;
			const total = events.length;
      
			events.forEach(event => {
				const request = store.put(event);
        
				request.onsuccess = () => {
					completed++;
					if (completed === total) {
						resolve();
					}
				};
        
				request.onerror = (event) => {
					console.error('Error storing event:', event.target.error);
					completed++;
					if (completed === total) {
						resolve(); // Still resolve to continue with other events
					}
				};
			});
      
			transaction.onerror = (event) => {
				reject(event.target.error);
			};
		});
	}

	async _loadFromIndexedDB() {
		await this._initIndexedDB();
    
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.getAll();
      
			request.onsuccess = () => {
				resolve(request.result);
			};
      
			request.onerror = (event) => {
				console.error('Error loading events:', event.target.error);
				reject(event.target.error);
			};
		});
	}

	async _clearEventsFromIndexedDB(eventIds) {
		await this._initIndexedDB();
    
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
      
			let completed = 0;
			const total = eventIds.length;
      
			eventIds.forEach(id => {
				const request = store.delete(id);
        
				request.onsuccess = () => {
					completed++;
					if (completed === total) {
						resolve();
					}
				};
        
				request.onerror = (event) => {
					console.error('Error deleting event:', event.target.error);
					completed++;
					if (completed === total) {
						resolve(); // Still resolve to continue with other events
					}
				};
			});
      
			transaction.onerror = (event) => {
				reject(event.target.error);
			};
		});
	}

	async _saveRetryInfoToIndexedDB(batchId, retryInfo) {
		await this._initIndexedDB();
    
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.retryInfoStoreName], 'readwrite');
			const store = transaction.objectStore(this.retryInfoStoreName);
      
			const data = { batchId, ...retryInfo };
			const request = store.put(data);
      
			request.onsuccess = () => {
				resolve();
			};
      
			request.onerror = (event) => {
				console.error('Error saving retry info:', event.target.error);
				reject(event.target.error);
			};
		});
	}

	async _getRetryBatchesFromIndexedDB() {
		await this._initIndexedDB();
    
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.retryInfoStoreName], 'readonly');
			const store = transaction.objectStore(this.retryInfoStoreName);
			const request = store.getAll();
      
			request.onsuccess = () => {
				const result = {};
				request.result.forEach(item => {
					result[item.batchId] = item;
				});
				resolve(result);
			};
      
			request.onerror = (event) => {
				console.error('Error getting retry batches:', event.target.error);
				reject(event.target.error);
			};
		});
	}

	async _clearIndexedDB() {
		await this._initIndexedDB();
    
		return new Promise((resolve, reject) => {
			const transaction = this.db.transaction([this.storeName, this.retryInfoStoreName], 'readwrite');
      
			const eventStore = transaction.objectStore(this.storeName);
			const retryStore = transaction.objectStore(this.retryInfoStoreName);
      
			const eventClearRequest = eventStore.clear();
			const retryClearRequest = retryStore.clear();
      
			let completed = 0;
      
			const checkCompletion = () => {
				completed++;
				if (completed === 2) {
					resolve();
				}
			};
      
			eventClearRequest.onsuccess = checkCompletion;
			retryClearRequest.onsuccess = checkCompletion;
      
			eventClearRequest.onerror = (event) => {
				console.error('Error clearing events:', event.target.error);
				checkCompletion();
			};
      
			retryClearRequest.onerror = (event) => {
				console.error('Error clearing retry info:', event.target.error);
				checkCompletion();
			};
      
			transaction.onerror = (event) => {
				reject(event.target.error);
			};
		});
	}
}

/**
 * API Client
 * Handles communication with the analytics endpoint
 */
class ApiClient {
	constructor(config) {
		this.config = config;
	}

	/**
	 * Send batch to server
	 * @param {Object} batch - Batch to send
	 * @returns {Promise} - API response
	 */
	async sendBatch(batch) {
		try {
			// Check connectivity before attempting to send
			if (!(await this.checkConnectivity())) {
				return { success: false, error: 'No network connectivity', statusCode: 0 };
			}

			const response = await fetch(this.config.API_ENDPOINT, {
				method: 'POST',
				headers: this.config.API_HEADERS,
				body: JSON.stringify(batch.events),
			});

			const result = await this.handleResponse(response);
			return result;
		} catch (error) {
			console.error('API request failed:', error);
			return { 
				success: false, 
				error: error.message, 
				statusCode: 0,
				retryable: true 
			};
		}
	}

	/**
	 * Check network connectivity
	 * @returns {Promise<boolean>} - True if connectivity available
	 */
	async checkConnectivity() {
		if (!navigator.onLine) return false;
    
		// Optional: perform a lightweight HEAD request to confirm connectivity
		try {
			const response = await fetch(this.config.API_ENDPOINT, { 
				method: 'HEAD',
				cache: 'no-cache'
			});
			return response.ok;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Process API response
	 * @param {Response} response - Fetch API response
	 * @returns {Object} - Processed response
	 */
	async handleResponse(response) {
		let data;
    
		if (response.ok) {
			try {
				data = await response.json();
				return {
					success: true,
					data,
					statusCode: response.status
				};
			} catch (error) {
				data = null;
			}
		}
    
		// Determine if error is retryable
		const isRetryable = response.status >= 500 || response.status === 429;
    
		return {
			success: false,
			error: data?.error || `HTTP error ${response.status}`,
			statusCode: response.status,
			retryable: isRetryable,
			data
		};
	}
}

/**
 * Retry Manager
 * Handles retry logic for failed API requests
 */
class RetryManager {
	constructor(config, apiClient, storageManager) {
		this.config = config;
		this.apiClient = apiClient;
		this.storageManager = storageManager;
		this.retryQueue = new Map();
	}

	/**
	 * Schedule retry with backoff
	 * @param {Object} batch - Batch to retry
	 * @param {number} attempt - Current attempt number
	 */
	scheduleRetry(batch, attempt) {
		if (attempt >= this.config.MAX_RETRIES) {
			this.handleMaxRetries(batch);
			return;
		}
    
		const delay = this.calculateRetryDelay(attempt);
		const batchId = batch.id;
		const retryTime = Date.now() + delay;
    
		// Save retry info to storage
		const retryInfo = {
			attempt,
			scheduledTime: retryTime,
			events: batch.events,
			createdAt: batch.createdAt
		};
    
		this.storageManager.saveRetryInfo(batchId, retryInfo);
    
		// Schedule retry
		const timeoutId = setTimeout(() => this.executeRetry(batchId), delay);
    
		// Store in memory for cancellation if needed
		this.retryQueue.set(batchId, {
			timeoutId,
			retryInfo
		});
	}

	/**
	 * Calculate delay for retry based on strategy
	 * @param {number} attempt - Current attempt number
	 * @returns {number} - Delay in milliseconds
	 */
	calculateRetryDelay(attempt) {
		const baseDelay = this.config.INITIAL_RETRY_DELAY;
    
		if (this.config.RETRY_STRATEGY === 'linear') {
			return baseDelay * attempt;
		} else { // exponential
			return baseDelay * Math.pow(2, attempt - 1);
		}
	}

	/**
	 * Execute retry for a batch
	 * @param {string} batchId - ID of batch to retry
	 */
	async executeRetry(batchId) {
		// Remove from queue
		const retryData = this.retryQueue.get(batchId);
		this.retryQueue.delete(batchId);
		let { retryInfo } = retryData || {};
    
		if (!retryInfo) {
			// Try to load from storage
			const retryBatches = await this.storageManager.getRetryBatches();
			retryInfo = retryBatches[batchId];

			if (!retryInfo) {
				console.warn(`No retry data found for batch ${batchId}`);
				return;
			}
		} 

		// Create batch from retry data
		const batch = {
			id: batchId,
			events: retryInfo.events,
			createdAt: retryInfo.createdAt
		};
      
		// Send batch
		const result = await this.apiClient.sendBatch(batch);
      
		if (result.success) {
			// Success - remove from storage
			const eventIds = batch.events.map(event => event.id);
			await this.storageManager.clearEvents(eventIds);
			await this.storageManager.updateRetryStatus(batchId, 'succeeded');
		} else if (result.retryable) {
			// Failed but retryable - schedule next retry
			this.scheduleRetry(batch, retryInfo.attempt + 1);
		} else {
			// Failed and not retryable - handle max retries
			this.handleMaxRetries(batch);
		}
	}

	/**
	 * Process all pending retries (useful on page load)
	 */
	async processRetries() {
		const retryBatches = await this.storageManager.getRetryBatches();
    
		for (const [batchId, retryInfo] of Object.entries(retryBatches)) {
			const now = Date.now();
			const scheduledTime = retryInfo.scheduledTime;
      
			if (scheduledTime <= now) {
				// Past scheduled time - retry immediately
				this.executeRetry(batchId);
			} else {
				// Schedule for future
				const delay = scheduledTime - now;
				const timeoutId = setTimeout(() => this.executeRetry(batchId), delay);
        
				this.retryQueue.set(batchId, {
					timeoutId,
					retryInfo
				});
			}
		}
	}

	/**
	 * Handle batches that hit max retries
	 * @param {Object} batch - Batch that failed
	 */
	async handleMaxRetries(batch) {
		const strategy = this.config.FAILED_EVENT_STRATEGY;
    
		if (strategy === 'keep') {
			// Keep events in storage for manual retry later
			const retryInfo = {
				attempt: this.config.MAX_RETRIES,
				status: 'max_retries_reached',
				events: batch.events,
				createdAt: batch.createdAt,
				updatedAt: Date.now()
			};
      
			await this.storageManager.saveRetryInfo(batch.id, retryInfo);
		} else { // 'discard'
			// Remove events from storage
			const eventIds = batch.events.map(event => event.id);
			await this.storageManager.clearEvents(eventIds);
			await this.storageManager.updateRetryStatus(batch.id, 'discarded');
		}
	}

	/**
	 * Clean up resources
	 */
	clearRetries() {
		// Clear all pending timeouts
		for (const [batchId, { timeoutId }] of this.retryQueue.entries()) {
			clearTimeout(timeoutId);
		}
    
		this.retryQueue.clear();
	}
}
/**
 * Batch Processor
 * Creates and manages batches of events
 */
class BatchProcessor {
	constructor(config, queueManager, apiClient, storageManager, retryManager) {
		this.config = config;
		this.queueManager = queueManager;
		this.apiClient = apiClient;
		this.storageManager = storageManager;
		this.retryManager = retryManager;
    
		this.batchIdCounter = 0;
		this.batchingTimeoutId = null;
		this.isProcessing = false;
    
		// Bind methods for event listeners
		this.handleBrowserUnload = this.handleBrowserUnload.bind(this);
    
		// Set up browser unload handler
		if (this.config.RETRY_ON_RELOAD) {
			window.addEventListener('beforeunload', this.handleBrowserUnload);
		}
    
		// Schedule initial batch processing
		this.scheduleBatch();
    
		// Process any pending retries
		this.retryManager.processRetries();
    
		// Try to recover any stored events
		this.recoverStoredEvents();
	}

	/**
	 * Create a new batch from events
	 * @param {Array} events - Events to include in batch
	 * @returns {Object} - Batch object
	 */
	createBatch(events) {
		if (!events || events.length === 0) return null;
    
		return {
			id: `batch_${++this.batchIdCounter}_${Date.now()}`,
			events,
			size: events.length,
			createdAt: Date.now()
		};
	}

	/**
	 * Process and send a batch
	 * @param {Object} batch - Batch to process
	 * @returns {Promise}
	 */
	async processBatch(batch) {
		if (!batch || batch.events.length === 0) return;
    
		const result = await this.apiClient.sendBatch(batch);
    
		if (result.success) {
			// Success - remove events from storage if they were there
			const eventIds = batch.events.map(event => event.id);
			await this.storageManager.clearEvents(eventIds);
		} else if (result.retryable) {
			// Failed but retryable - handle via retry manager
			this.retryManager.scheduleRetry(batch, 1);
		} else {
			// Failed and not retryable - handle according to config
			if (this.config.FAILED_EVENT_STRATEGY === 'keep') {
				await this.storageManager.saveEvents(batch.events);
			}
		}
    
		return result;
	}

	/**
	 * Schedule batch processing based on thresholds
	 */
	scheduleBatch() {
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
		}
    
		this.batchingTimeoutId = setTimeout(() => {
			this.attemptProcessing();
		}, this.config.IDLE_THRESHOLD);
	}

	/**
	 * Attempt to process events in the queue
	 */
	async attemptProcessing() {
		if (this.isProcessing) {
			this.scheduleBatch();
			return;
		}
    
		this.isProcessing = true;
    
		try {
			// Get events from queue up to max batch size
			const events = this.queueManager.getEvents(this.config.MAX_BATCH_SIZE);
      
			if (events.length > 0) {
				const batch = this.createBatch(events);
				await this.processBatch(batch);
			}
		} finally {
			this.isProcessing = false;
			this.scheduleBatch();
		}
	}

	/**
	 * Prioritize batches by importance if needed
	 * @param {Array} batches - Batches to prioritize
	 * @returns {Array} - Prioritized batches
	 */
	prioritizeBatches(batches) {
		// Example implementation - prioritize by age (oldest first)
		return batches.sort((a, b) => a.createdAt - b.createdAt);
	}

	/**
	 * Force send all pending events
	 * @returns {Promise}
	 */
	async flush() {
		// Cancel current timing
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
			this.batchingTimeoutId = null;
		}
    
		// Wait for any current processing to complete
		if (this.isProcessing) {
			await new Promise(resolve => {
				const checkProcessing = () => {
					if (!this.isProcessing) {
						resolve();
					} else {
						setTimeout(checkProcessing, 50);
					}
				};
				checkProcessing();
			});
		}
    
		this.isProcessing = true;
    
		try {
			// Process all events in queue
			while (!this.queueManager.isEmpty()) {
				const events = this.queueManager.getEvents(this.config.MAX_BATCH_SIZE);
				if (events.length > 0) {
					const batch = this.createBatch(events);
					await this.processBatch(batch);
				}
			}
      
			// Try to process any stored events
			await this.processStoredEvents();
		} finally {
			this.isProcessing = false;
			this.scheduleBatch();
		}
	}

	/**
	 * Handle browser unload event
	 */
	handleBrowserUnload() {
		// Save any events from queue that haven't been sent yet
		if (!this.queueManager.isEmpty()) {
			const remainingEvents = this.queueManager.getEvents(this.queueManager.size());
			if (remainingEvents.length > 0) {
				// Use synchronous localStorage for unload event
				try {
					this.storageManager.saveEvents(remainingEvents);
				} catch (error) {
					console.error('Failed to save events during unload:', error);
				}
			}
		}
	}

	/**
	 * Try to recover and send stored events
	 */
	async recoverStoredEvents() {
		// Small delay to let page load
		setTimeout(async () => {
			await this.processStoredEvents();
		}, 1000);
	}

	/**
	 * Process events from storage
	 */
	async processStoredEvents() {
		const events = await this.storageManager.loadEvents();
    
		if (events.length === 0) return;
    
		// Process in batches
		for (let i = 0; i < events.length; i += this.config.MAX_BATCH_SIZE) {
			const batchEvents = events.slice(i, i + this.config.MAX_BATCH_SIZE);
			const batch = this.createBatch(batchEvents);
      
			if (batch) {
				await this.processBatch(batch);
			}
		}
	}

	/**
	 * Clean up resources
	 */
	cleanup() {
		if (this.batchingTimeoutId) {
			clearTimeout(this.batchingTimeoutId);
			this.batchingTimeoutId = null;
		}
    
		if (this.config.RETRY_ON_RELOAD) {
			window.removeEventListener('beforeunload', this.handleBrowserUnload);
		}
    
		this.retryManager.clearRetries();
	}
}

/**
 * Main Analytics Module
 * Primary interface for tracking events and managing the analytics lifecycle
 */
class Analytics {
	constructor(options = {}) {
		// Initialize configuration
		this.config = new AnalyticsConfig(options);
    
		// Initialize components
		this.queueManager = new EventQueueManager();
		this.storageManager = new StorageManager(this.config);
		this.apiClient = new ApiClient(this.config);
		this.retryManager = new RetryManager(this.config, this.apiClient, this.storageManager);
		this.batchProcessor = new BatchProcessor(
			this.config, 
			this.queueManager, 
			this.apiClient, 
			this.storageManager,
			this.retryManager
		);
    
		// Add any additional initialization metadata
		this.metadata = {
			sessionId: this._generateSessionId(),
			startTime: Date.now(),
			userAgent: navigator.userAgent,
			screenWidth: window.screen.width,
			screenHeight: window.screen.height
		};
	}

	/**
	 * Track an event
	 * @param {string} eventType - Type of event to trackEvent
	 * @param {Object} eventData - Event data
	 * @param {boolean} [immediate=false] - Whether to process immediately
	 * @returns {string} - Generated event ID
	 */
	trackEvent(eventType, eventData = {}, immediate = false) {
		if (!eventType) {
			console.error('Event type is required');
			return null;
		}
    
		// Create the event object
		const event = {
			type: eventType,
			data: eventData,
			timestamp: new Date().toISOString(),
			metadata: { ...this.metadata }
		};
    
		// Add to queue
		const eventId = this.queueManager.enqueue(event);
    
		// Process immediately if requested
		if (immediate) {
			this.batchProcessor.attemptProcessing();
		}
    
		return eventId;
	}

	/**
	 * Track page view event
	 * @param {Object} pageData - Page data
	 * @param {boolean} [immediate=false] - Whether to process immediately
	 * @returns {string} - Generated event ID
	 */
	trackPageView(pageData = {}, immediate = false) {
		// Enhance with default page info if not provided
		const enhancedData = {
			url: window.location.href,
			path: window.location.pathname,
			referrer: document.referrer,
			title: document.title,
			...pageData
		};
    
		return this.trackEvent('pageview', enhancedData, immediate);
	}

	/**
	 * Track click event
	 * @param {HTMLElement|string} element - Element or selector that was clicked
	 * @param {Object} clickData - Additional click data
	 * @param {boolean} [immediate=false] - Whether to process immediately
	 * @returns {string} - Generated event ID
	 */
	trackClick(element, clickData = {}, immediate = false) {
		let elementInfo = {};
    
		if (typeof element === 'string') {
			// If element is a selector, try to find it
			const foundElement = document.querySelector(element);
			if (foundElement) {
				elementInfo = this._extractElementInfo(foundElement);
			} else {
				elementInfo = { selector: element, found: false };
			}
		} else if (element instanceof HTMLElement) {
			elementInfo = this._extractElementInfo(element);
		}
    
		return this.trackEvent('click', { ...elementInfo, ...clickData }, immediate);
	}

	/**
	 * Force send all pending events
	 * @returns {Promise}
	 */
	flush() {
		return this.batchProcessor.flush();
	}

	/**
	 * Clean up resources
	 */
	destroy() {
		this.batchProcessor.cleanup();
	}

	/**
	 * Update configuration
	 * @param {Object} options - New configuration options
	 */
	updateConfig(options) {
		// Create new config with merged options
		const newConfig = new AnalyticsConfig({
			...this.config,
			...options
		});
    
		// Update components with new config
		this.config = newConfig;
    
		// Restart batch processing with new config
		this.batchProcessor.cleanup();
		this.batchProcessor = new BatchProcessor(
			this.config, 
			this.queueManager, 
			this.apiClient, 
			this.storageManager,
			this.retryManager
		);
	}

	/**
	 * Generate a unique session ID
	 * @returns {string} - Session ID
	 * @private
	 */
	_generateSessionId() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	/**
	 * Extract useful information from an HTML element
	 * @param {HTMLElement} element - Element to extract info from
	 * @returns {Object} - Element information
	 * @private
	 */
	_extractElementInfo(element) {
		if (!element) return {};
    
		return {
			tagName: element.tagName.toLowerCase(),
			id: element.id || undefined,
			className: element.className || undefined,
			text: element.innerText?.substring(0, 100) || undefined,
			href: element.href || undefined,
			value: element.value || undefined,
			type: element.type || undefined,
			name: element.name || undefined
		};
	}
}

// Example usage
const analytics = new Analytics({
	apiEndpoint: 'https://api.example.com/analytics',
	batchSize: 10,
	batchingInterval: 30000, // 30 seconds
	retryCount: 3,
	retryStrategy: 'exponential',
	storageType: 'localStorage'
});

// Track events
analytics.trackPageView();
analytics.trackEvent('feature_used', { feature: 'search', query: 'analytics' });
analytics.trackClick('#signup-button', { campaign: 'summer_promo' });

// Force send all events before navigating away
document.getElementById('checkout-button').addEventListener('click', async () => {
	await analytics.flush();
	window.location.href = '/checkout';
});