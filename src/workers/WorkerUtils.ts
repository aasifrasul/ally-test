import { WorkerMessageQueue } from './WorkerMessageQueue';

let worker: Worker | null = null;
let messageQueue: WorkerMessageQueue | null = null;

export const initializeWorker = (): void => {
	if (worker) {
		return;
	}

	worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));

	if (!worker) {
		throw new Error('Failed to initialize web worker');
	}
};

export const initializeMessageQueue = (): WorkerMessageQueue => {
	if (messageQueue) {
		return messageQueue; // Return existing queue if already initialized
	}

	initializeWorker();

	if (!worker) {
		throw new Error('Worker initialization failed');
	}

	messageQueue = new WorkerMessageQueue(worker);

	if (!messageQueue) {
		throw new Error('Failed to initialize worker message queue');
	}

	return messageQueue;
};

export const closeWorker = (): void => {
	if (worker) {
		worker.terminate();
		worker = null;
	}
};

export const closeMessageQueue = (): void => {
	closeWorker();
	messageQueue = null;
};
