import { Signal, signal } from '@preact/signals-react';

export type Signalify<T> = {
	[K in keyof T]: Signal<T[K]>;
};

/**
 * Returns an object where every property of the passed object is converted to a signal.
 * Runs non-recursively: Only immediate properties are converted.
 */
export function signalify<T extends Record<string, unknown>>(obj: T) {
	return Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [key, signal(value)]),
	) as Signalify<T>;
}
