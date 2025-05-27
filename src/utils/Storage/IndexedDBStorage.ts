import { createLogger, LogLevel, Logger } from '../../utils/logger';

const logger: Logger = createLogger('IndexedDBStorage', {
	level: LogLevel.DEBUG,
});

export class IndexedDBStorage {
	private database: IDBDatabase | null = null;
	private databaseName: string;
	private storeName: string;
	private initialized: boolean = false;
	private dbVersion: number = 1;

	constructor(databaseName: string = 'myDB', storeName: string = 'myObjectStore') {
		this.databaseName = databaseName;
		this.storeName = storeName;
	}

	// Helper method to wrap requests in promises with consistent error handling
	private requestHandler<T>(request: IDBRequest<T>, operation: string): Promise<T> {
		return new Promise((resolve, reject) => {
			request.addEventListener('success', () => {
				logger.debug(`${operation} request completed successfully`);
				resolve(request.result);
			});

			request.addEventListener('error', (event: Event) => {
				const error = (event.target as IDBRequest).error;
				logger.error(`${operation} request error:`, error);
				reject(error);
			});
		});
	}

	// Helper method to wrap transactions with consistent error handling
	private transactionHandler(transaction: IDBTransaction, operation: string): Promise<void> {
		return new Promise((resolve, reject) => {
			transaction.addEventListener('complete', () => {
				logger.debug(`${operation} transaction completed successfully`);
				resolve();
			});

			transaction.addEventListener('error', (event: Event) => {
				const error = (event.target as IDBTransaction).error;
				logger.error(`${operation} transaction error:`, error);
				reject(error);
			});

			transaction.addEventListener('abort', () => {
				logger.warn(`${operation} transaction aborted`);
				reject(new Error(`${operation} transaction aborted`));
			});
		});
	}

	async initialize(): Promise<void> {
		if (this.initialized) {
			logger.info('Storage already initialized');
			return;
		}

		try {
			await this.open();
			this.initialized = true;
			logger.info('Storage initialized successfully');
		} catch (error) {
			logger.error('Failed to initialize storage:', error);
			throw error;
		}
	}

	private async open(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.database) {
				logger.info('Database already opened.');
				resolve();
				return;
			}

			const request: IDBOpenDBRequest = indexedDB.open(this.databaseName, this.dbVersion);

			request.addEventListener('success', (event: Event) => {
				this.database = (event.target as IDBOpenDBRequest).result;
				logger.info('Database opened successfully');
				resolve();
			});

			request.addEventListener('error', (event: Event) => {
				const error = (event.target as IDBOpenDBRequest).error;
				logger.error('Database open error:', error);
				reject(error);
			});

			request.addEventListener('upgradeneeded', (event: IDBVersionChangeEvent) => {
				const database: IDBDatabase = (event.target as IDBOpenDBRequest).result;
				const oldVersion = event.oldVersion;
				const newVersion = event.newVersion;

				logger.info(
					`Database upgrade needed from version ${oldVersion} to ${newVersion}`,
				);

				if (!database.objectStoreNames.contains(this.storeName)) {
					const objectStore: IDBObjectStore = database.createObjectStore(
						this.storeName,
						{ keyPath: 'id' },
					);
					logger.info('Object store created successfully');
				} else {
					logger.info(`Object store '${this.storeName}' already exists.`);
				}
			});
		});
	}

	private getTransaction(mode: IDBTransactionMode = 'readonly'): IDBTransaction {
		if (!this.initialized || !this.database) {
			throw new Error(
				'Storage not initialized or database not open. Call initialize() first.',
			);
		}
		return this.database.transaction([this.storeName], mode);
	}

	private getObjectStore(mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
		const transaction = this.getTransaction(mode);
		return transaction.objectStore(this.storeName);
	}

	async getAllKeys(): Promise<IDBValidKey[]> {
		if (!this.initialized) {
			throw new Error('Storage not initialized. Call initialize() first.');
		}

		const objectStore = this.getObjectStore();
		const request = objectStore.getAllKeys();

		const keys = await this.requestHandler(request, 'getAllKeys');
		logger.info('Retrieved all keys:', keys);
		return keys;
	}

	async getItem<T>(key: IDBValidKey): Promise<T | null> {
		if (!this.initialized) {
			throw new Error('Storage not initialized. Call initialize() first.');
		}

		const objectStore = this.getObjectStore();
		const request = objectStore.get(key);

		const result = await this.requestHandler(request, `getItem(${key})`);

		if (result) {
			logger.info('Data retrieved:', result);
			return result.value;
		} else {
			logger.info('No data found for key', key);
			return null;
		}
	}

	async setItem(key: IDBValidKey, value: any): Promise<void> {
		if (!this.initialized) {
			throw new Error('Storage not initialized. Call initialize() first.');
		}

		const transaction = this.getTransaction('readwrite');
		const objectStore = transaction.objectStore(this.storeName);
		const request = objectStore.put({ id: key, value: value });

		// For write operations, we need to wait for transaction completion
		await Promise.all([
			this.requestHandler(request, `setItem(${key})`),
			this.transactionHandler(transaction, `setItem(${key})`),
		]);

		logger.info('Data added/updated successfully for key:', key);
	}

	async removeItem(key: IDBValidKey): Promise<void> {
		if (!this.initialized) {
			throw new Error('Storage not initialized. Call initialize() first.');
		}

		const transaction = this.getTransaction('readwrite');
		const objectStore = transaction.objectStore(this.storeName);
		const request = objectStore.delete(key);

		// Wait for both request and transaction completion
		await Promise.all([
			this.requestHandler(request, `removeItem(${key})`),
			this.transactionHandler(transaction, `removeItem(${key})`),
		]);

		logger.info('Data deletion completed for key:', key);
	}

	async contains(key: IDBValidKey): Promise<boolean> {
		const value = await this.getItem(key);
		return value !== null;
	}

	async clear(): Promise<void> {
		if (!this.initialized) {
			throw new Error('Storage not initialized. Call initialize() first.');
		}

		const transaction = this.getTransaction('readwrite');
		const objectStore = transaction.objectStore(this.storeName);
		const request = objectStore.clear();

		// Wait for both request and transaction completion
		await Promise.all([
			this.requestHandler(request, 'clear'),
			this.transactionHandler(transaction, 'clear'),
		]);

		logger.info('Store cleared successfully');
	}

	close(): void {
		if (this.database) {
			this.database.close();
			this.database = null;
			this.initialized = false;
			logger.info('Database closed');
		}
	}
}