import { isObject } from '../typeChecking';
import { createImmutable } from '../immutable';

type EventMap = {
	buttonClicked: { message: string };
	userLoggedIn: { userId: number; username: string };
	dataLoaded: { items: any[]; timestamp: Date };
	errorOccurred: { error: string; code: number };
};

class EventBus<Events extends Record<string, any>> {
	private listeners: {
		[K in keyof Events]?: ((data: Events[K]) => void)[];
	} = {};

	on<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}

		// Add this check to prevent duplicate listeners
		if (!this.listeners[event]?.includes(callback)) {
			this.listeners[event]?.push(callback);
		}

		// Return cleanup function
		return () => this.off(event, callback);
	}

	off<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event]?.filter(
				(listener) => listener !== callback,
			);
			// Clean up empty arrays
			if (this.listeners[event]?.length === 0) {
				delete this.listeners[event];
			}
		}
	}

	emit<K extends keyof Events>(event: K, data: Events[K]) {
		const immutableData = isObject(data) ? createImmutable(data) : data;

		this.listeners[event]?.forEach((listener) => listener(immutableData));
	}

	once<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
		const cleanup = this.on(event, (data) => {
			cleanup();
			callback(data);
		});
		return cleanup;
	}
}

const eventBus = new EventBus<EventMap>();
