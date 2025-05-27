import { BaseQueue } from "../AsyncQueue/BaseQueue";

export class EventQueueManager<T> extends BaseQueue<T> {

	getEvents(count: number) {
		const events: T[] = [];
		const actualCount: number = Math.min(count, this.size);

		for (let i = 0; i < actualCount; i++) {
			events.push(this.dequeue()!);
		}

		return events;
	}
}
