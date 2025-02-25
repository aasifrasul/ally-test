type EventMap = {
	buttonClicked: { message: string };
	// Add other events here
};

class EventBus<Events extends Record<string, any>> {
	private listeners: {
		[K in keyof Events]?: ((data: Events[K]) => void)[];
	} = {};

	on<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event]?.push(callback);
	}

	off<K extends keyof Events>(event: K, callback: (data: Events[K]) => void) {
		if (this.listeners[event]) {
			this.listeners[event] = this.listeners[event]?.filter(
				(listener) => listener !== callback,
			);
		}
	}

	emit<K extends keyof Events>(event: K, data: Events[K]) {
		this.listeners[event]?.forEach((listener) => listener(data));
	}
}

const eventBus = new EventBus<EventMap>();
