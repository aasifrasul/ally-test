import { AsyncQueue } from './index';

export class TimeoutAsyncQueue<T> extends AsyncQueue<T> {
	addToQueue(action: () => Promise<T>, autoDequeue: boolean = true): Promise<T> {
		const timeout = 5000;
		const timeoutPromise = new Promise<T>((_, reject) => {
			setTimeout(() => reject(new Error('Queue item timeout')), timeout);
		});

		return super.addToQueue(async () => {
			return Promise.race([action(), timeoutPromise]);
		}, autoDequeue);
	}
}
