import { Storage, StorageType } from './Storage';

class StorageManager {
	constructor(config) {
		this.config = config;
		this.dbName = 'analyticsDb';
		this.eventsStoreName = 'events';
		this.retryInfoStoreName = 'retryInfo';

		// Create separate Storage instances for each store
		this.eventsStorage = new Storage(
			StorageType.INDEXED_DB,
			this.dbName,
			this.eventsStoreName,
		);
		this.retryStorage = new Storage(
			StorageType.INDEXED_DB,
			this.dbName,
			this.retryInfoStoreName,
		);

		this.isInitialized = false;
	}

	/**
	 * Initialize both storage instances
	 */
	async initialize() {
		if (this.isInitialized) return;

		try {
			await Promise.all([
				this.eventsStorage.initialize(),
				this.retryStorage.initialize(),
			]);
			this.isInitialized = true;
		} catch (error) {
			console.error('Failed to initialize storage:', error);
			throw error;
		}
	}

	/**
	 * Save events to storage (bulk operation)
	 * @param {Array} events - Events to save
	 * @returns {Promise}
	 */
	async saveEvents(events) {
		if (!events || events.length === 0) return;

		try {
			await this.initialize();

			// Get existing events and merge with new ones
			const existingEvents = await this.loadEvents();
			const allEvents = [...existingEvents, ...events];

			// Store as single bulk item
			await this.eventsStorage.setItem('events_bulk', allEvents);
		} catch (error) {
			console.error('Failed to save events to storage:', error);
			throw error;
		}
	}

	/**
	 * Load saved events from storage
	 * @returns {Promise<Array>} - Array of saved events
	 */
	async loadEvents() {
		try {
			await this.initialize();

			const events = await this.eventsStorage.getItem('events_bulk');
			return events || [];
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
		if (!eventIds || eventIds.length === 0) return;

		try {
			await this.initialize();

			// Load all events, filter out the ones to clear, then save back
			const allEvents = await this.loadEvents();
			const eventIdsSet = new Set(eventIds);
			const remainingEvents = allEvents.filter((event) => !eventIdsSet.has(event.id));

			if (remainingEvents.length === 0) {
				await this.eventsStorage.removeItem('events_bulk');
			} else {
				await this.eventsStorage.setItem('events_bulk', remainingEvents);
			}
		} catch (error) {
			console.error('Failed to clear events from storage:', error);
			throw error;
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
			await this.initialize();

			const retryData = {
				batchId,
				...retryInfo,
				updatedAt: Date.now(),
			};

			await this.retryStorage.setItem(batchId, retryData);
		} catch (error) {
			console.error('Failed to save retry info:', error);
			throw error;
		}
	}

	/**
	 * Get batches pending retry
	 * @returns {Promise<Object>} - Object with batch IDs as keys
	 */
	async getRetryBatches() {
		try {
			await this.initialize();

			const keys = await this.retryStorage.getAllKeys();
			const loadPromises = keys.map((key) => this.retryStorage.getItem(key));

			const retryInfos = await Promise.all(loadPromises);
			const result = {};

			retryInfos.forEach((retryInfo, index) => {
				if (retryInfo) {
					result[keys[index]] = retryInfo;
				}
			});

			return result;
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
		try {
			await this.initialize();

			const existingRetryInfo = await this.retryStorage.getItem(batchId);

			if (existingRetryInfo) {
				const updatedRetryInfo = {
					...existingRetryInfo,
					status,
					updatedAt: Date.now(),
				};

				await this.retryStorage.setItem(batchId, updatedRetryInfo);
			}
		} catch (error) {
			console.error('Failed to update retry status:', error);
			throw error;
		}
	}

	/**
	 * Remove completed retry info
	 * @param {string} batchId - ID of batch to remove
	 */
	async removeRetryInfo(batchId) {
		try {
			await this.initialize();
			await this.retryStorage.removeItem(batchId);
		} catch (error) {
			console.error('Failed to remove retry info:', error);
			throw error;
		}
	}

	/**
	 * Clear all stored data
	 * @returns {Promise}
	 */
	async clearAllData() {
		try {
			await this.initialize();

			await Promise.all([
				this.eventsStorage.removeItem('events_bulk'),
				this.retryStorage.clear(),
			]);
		} catch (error) {
			console.error('Failed to clear storage:', error);
			throw error;
		}
	}

	/**
	 * Get storage statistics
	 * @returns {Promise<Object>} - Storage usage info
	 */
	async getStorageStats() {
		try {
			await this.initialize();

			const [events, retryKeys, capacity] = await Promise.all([
				this.loadEvents(),
				this.retryStorage.getAllKeys(),
				this.eventsStorage.getStorageCapacity(),
			]);

			return {
				eventCount: events.length,
				retryBatchCount: retryKeys.length,
				capacity,
			};
		} catch (error) {
			console.error('Failed to get storage stats:', error);
			return { eventCount: 0, retryBatchCount: 0, capacity: null };
		}
	}

	/**
	 * Close storage connections
	 */
	close() {
		this.eventsStorage.close();
		this.retryStorage.close();
		this.isInitialized = false;
	}
}
