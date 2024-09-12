export default class WorkerMessageQueue {
	private worker: Worker;
	private queue: Map<number, { resolve: Function; reject: Function }>;
	private currentId: number;

	constructor(worker: Worker) {
		this.worker = worker;
		this.queue = new Map();
		this.currentId = 0;

		this.worker.addEventListener('message', this.handleMessage.bind(this));
	}

	sendMessage(type: string, data): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = ++this.currentId;
			this.queue.set(id, { resolve, reject });
			this.worker.postMessage({ id, type, data });
		});
	}

	handleMessage(event: MessageEvent): void {
		const { id, data, error } = event.data;
		const pending = this.queue.get(id);
		if (pending) {
			this.queue.delete(id);
			if (error) {
				pending.reject(error);
			} else {
				pending.resolve(data);
			}
		}
	}

	fetchAPIData(endpoint: string, options): Promise<any> {
		return this.sendMessage('fetchAPIData', { endpoint, options });
	}

	loadImages(imageUrls: string[]): Promise<void> {
		return this.sendMessage('loadImages', imageUrls);
	}

	loadImage(imageUrl: string): Promise<void> {
		return this.sendMessage('loadImage', imageUrl);
	}

	abortFetchRequest(endpoint: string): Promise<void> {
		return this.sendMessage('abortFetchRequest', endpoint);
	}
}
