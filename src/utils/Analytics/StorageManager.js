class StorageManager {
	constructor(config) {
		this.config = config;
		this.dbName = 'analyticsDb';
		this.storeName = 'events';
		this.retryInfoStoreName = 'retryInfo';
		this.isDbInitialized = false;
	}

	/**
	 * Save events to storage
	 * @param {Array} events - Events to save
	 * @returns {Promise}
	 */
	async saveEvents(events) {
		if (!events || events.length === 0) return;

		try {
			return this._saveToIndexedDB(events);
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
			return this._loadFromIndexedDB();
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
			return this._clearEventsFromIndexedDB(eventIds);
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
			return this._saveRetryInfoToIndexedDB(batchId, retryInfo);
		} catch (error) {
			console.error('Failed to save retry info:', error);
		}
	}

	/**
	 * Get batches pending retry
	 * @returns {Promise<Object>} - Object with batch IDs as keys
	 */
	async getRetryBatches() {
		try {
			return this._getRetryBatchesFromIndexedDB();
		} catch (error) {
			console.error('Failed to get retry batches:', error);
			return {};
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
	 * Clear all stored data
	 * @returns {Promise}
	 */
	async clearAllData() {
		try {
			return this._clearIndexedDB();
		} catch (error) {
			console.error('Failed to clear storage:', error);
		}
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