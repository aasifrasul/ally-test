import { WorkerMessageQueue } from './WorkerMessageQueue';

export class WorkerManager {
	private static instance: WorkerManager | null = null;
	private worker: Worker | null = null;

	private constructor() {}

	public static getInstance(): WorkerManager {
		if (!WorkerManager.instance) {
			WorkerManager.instance = new WorkerManager();
		}
		return WorkerManager.instance;
	}

	public initializeWorker(): void {
		if (this.worker) {
			return;
		}

		this.worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));

		if (!this.worker) {
			throw new Error('Failed to initialize web worker');
		}
	}

	public initializeMessageQueue(): WorkerMessageQueue {
		this.initializeWorker();

		if (!this.worker) {
			throw new Error('Worker initialization failed');
		}

		WorkerMessageQueue.initialize(this.worker);
		const messageQueue: WorkerMessageQueue | null = WorkerMessageQueue.getInstance();

		if (!messageQueue) {
			throw new Error('Failed to initialize worker message queue');
		}

		return messageQueue;
	}

	public closeWorker(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
	}

	public closeMessageQueue(): void {
		this.closeWorker();
	}
}
