import { createLogger, LogLevel, Logger } from '../../utils/logger';

const logger: Logger = createLogger('IndexedDBStorage', {
	level: LogLevel.DEBUG,
});

export class IndexedDBStorage {
	private db: IDBDatabase | null = null;
	private dbName: string;
	private storeName: string;

	constructor(dbName: string = 'myDB', storeName: string = 'myObjectStore') {
		this.dbName = dbName;
		this.storeName = storeName;
	}

	private async open(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.db) {
				logger.info('Database already opened.');
				resolve();
				return;
			}

			const request: IDBOpenDBRequest = indexedDB.open(this.dbName, 1);

			request.addEventListener('success', (event: Event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				logger.info('Database opened successfully');
				resolve();
			});

			request.addEventListener('error', (event: Event) => {
				logger.error('Database error:', (event.target as IDBOpenDBRequest).error);
				reject((event.target as IDBOpenDBRequest).error);
			});

			request.addEventListener('upgradeneeded', (event: IDBVersionChangeEvent) => {
				const database: IDBDatabase = (event.target as IDBOpenDBRequest).result;
				const objectStore: IDBObjectStore = database.createObjectStore(
					this.storeName,
					{
						keyPath: 'id',
					},
				);

				objectStore.transaction.addEventListener('complete', () => {
					logger.info('Object store created successfully');
				});
			});
		});
	}

	private async fetchTransaction(
		mode: IDBTransactionMode = 'readonly',
	): Promise<IDBTransaction> {
		await this.open();
		const transaction: IDBTransaction = this.db!.transaction([this.storeName], mode);
		return transaction;
	}

	async getItem<T>(key: string): Promise<T | null> {
		await this.open();
		const transaction: IDBTransaction = await this.fetchTransaction();

		return new Promise((resolve, reject) => {
			const objectStore: IDBObjectStore = transaction.objectStore(this.storeName);
			const request: IDBRequest<any> = objectStore.get(key);

			request.addEventListener('success', () => {
				if (request.result) {
					logger.info('Data retrieved:', request.result);
					resolve(request.result.value);
				} else {
					logger.info('No data found for key', key);
					resolve(null);
				}
			});

			request.addEventListener('error', (event: Event) => {
				logger.error('Data retrieval error:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			});
		});
	}

	async setItem(key: string, value: any): Promise<void> {
		await this.open();
		const transaction: IDBTransaction = await this.fetchTransaction('readwrite');

		return new Promise((resolve, reject) => {
			const objectStore: IDBObjectStore = transaction.objectStore(this.storeName);
			const request: IDBRequest<IDBValidKey> = objectStore.put({
				id: key,
				value: value,
			});

			request.addEventListener('success', () => {
				logger.info('Data added successfully');
				resolve();
			});

			request.addEventListener('error', (event: Event) => {
				logger.error('Data addition error:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			});
		});
	}

	async removeItem(key: string): Promise<void> {
		await this.open();
		const transaction: IDBTransaction = await this.fetchTransaction('readwrite');

		return new Promise((resolve, reject) => {
			const objectStore: IDBObjectStore = transaction.objectStore(this.storeName);
			const request: IDBRequest<undefined> = objectStore.delete(key);

			request.addEventListener('success', () => {
				logger.info('Data deleted successfully');
				resolve();
			});

			request.addEventListener('error', (event: Event) => {
				logger.error('Data deletion error:', (event.target as IDBRequest).error);
				reject((event.target as IDBRequest).error);
			});
		});
	}

	async contains(key: string): Promise<boolean> {
		const value = await this.getItem(key);
		return value !== null;
	}

	close(): void {
		if (this.db) {
			this.db.close();
			this.db = null;
			logger.info('Database closed');
		}
	}
}

// const storage = new IndexedDBStorage('myCustomDB', 'myCustomStore');
// storage.setItem('key', 'value');
// storage.getItem('key').then((value) => console.log(value));
// storage.removeItem('key');
// storage.contains('key').then((value) => console.log(value));
// storage.close();
