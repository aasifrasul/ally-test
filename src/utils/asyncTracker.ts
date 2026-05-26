type Listener = (pending: number) => void;

let pending = 0;
const listeners = new Set<Listener>();

function notify() {
	for (const l of listeners) l(pending);
}

export function trackAsync<T>(promise: Promise<T>): Promise<T> {
	pending++;
	notify();

	return promise.finally(() => {
		pending--;
		notify();
	});
}

export function subscribe(listener: Listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getPending() {
	return pending;
}

export async function trackedFetch(...args: Parameters<typeof fetch>) {
	return trackAsync(fetch(...args));
}
