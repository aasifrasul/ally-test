//import MyWorker from './MyWorker.worker';
import { WorkerMessageQueue } from './WorkerMessageQueue';

let worker: Worker | null = null;
let messageQueue: WorkerMessageQueue | null = null;

export const initializeWorker = (): WorkerMessageQueue => {
	if (!worker) {
		worker = new Worker(new URL('./MyWorker.worker.ts', import.meta.url));
		messageQueue = new WorkerMessageQueue(worker);
	}
	if (!messageQueue) {
		throw new Error('Failed to initialize worker message queue');
	}
	return messageQueue;
};

export const terminateWorker = (): void => {
	if (worker) {
		worker.terminate();
		worker = null;
		messageQueue = null;
	}
};
