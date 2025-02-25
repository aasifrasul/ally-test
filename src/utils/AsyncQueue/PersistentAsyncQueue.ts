import { AsyncQueue } from './index';

interface StorageProvider {
	save(key: string, data: any): Promise<void>;
	load(key: string): Promise<any>;
}

export class PersistentAsyncQueue<T> extends AsyncQueue<T> {
	constructor(
		private storage: StorageProvider,
		private queueId: string,
	) {
		super();
		this.loadState();
	}

	private async loadState() {
		const savedState = await this.storage.load(this.queueId);
		if (savedState) {
			// Restore queue state
			this.map = new Map(savedState.map);
			this.upperLimit = savedState.upperLimit;
			this.lowerLimit = savedState.lowerLimit;
		}
	}

	async saveState() {
		await this.storage.save(this.queueId, {
			map: Array.from(this.map.entries()),
			upperLimit: this.upperLimit,
			lowerLimit: this.lowerLimit,
		});
	}
}
