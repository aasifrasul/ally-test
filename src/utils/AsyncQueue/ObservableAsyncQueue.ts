import { AsyncQueue } from './index';

import { EventEmitter } from 'events';

export class ObservableAsyncQueue<T> extends AsyncQueue<T> {
	private emitter = new EventEmitter();

	addToQueue(action: () => Promise<T>): Promise<T> {
		this.emitter.emit('itemAdded', this.size + 1);
		return super.addToQueue(action);
	}

	async processQueue(): Promise<boolean> {
		this.emitter.emit('processingStarted', this.size);
		const result = await super.processQueue();
		this.emitter.emit('processingEnded', this.size);
		return result;
	}

	onItemAdded(callback: (queueSize: number) => void) {
		this.emitter.on('itemAdded', callback);
	}
}
