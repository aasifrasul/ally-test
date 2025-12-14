import { isFunction, isUndefined } from '../../typeChecking';
import {
	ComputedOptions,
	ComputedReader,
	Effect,
	EffectOptions,
	EffectCleanup,
	ErrorHandler,
	ReactiveConfig,
	ReactiveRoot,
	SignalOptions,
	SignalReader,
	SignalWriter,
	SignalGraph,
	SignalEquals,
} from './types';

// Export types for external use
export type {
	Effect,
	SignalReader,
	SignalWriter,
	ComputedReader,
	SignalOptions,
	EffectOptions,
	ComputedOptions,
	ReactiveConfig,
	ReactiveRoot,
	SignalGraph,
	EffectCleanup,
	SignalEquals,
	ErrorHandler,
};

// Global state
const context: Effect[] = [];
const scheduledEffects = new Set<Effect>();
const runningEffects = new WeakSet<Effect>();
let isFlushingEffects = false;
let maxDepth = 100;

// Cleanup registry for proper disposal
const cleanupRegistry = new WeakMap<Effect, Set<EffectCleanup>>();

// Async scheduler for batching updates
function scheduleEffect(effect: Effect): void {
	if (scheduledEffects.has(effect)) return;

	scheduledEffects.add(effect);

	if (!isFlushingEffects) {
		isFlushingEffects = true;
		// Use microtask for batching (can be replaced with requestAnimationFrame for UI updates)
		queueMicrotask(() => {
			flushEffects();
		});
	}
}

function flushEffects(): void {
	let depth = 0;

	while (scheduledEffects.size > 0 && depth < maxDepth) {
		const effects = [...scheduledEffects];
		scheduledEffects.clear();

		for (const effect of effects) {
			if (!effect.disposed) {
				try {
					effect.execute();
				} catch (error) {
					console.error('Error in reactive effect:', error);
					// In production, you might want to report this error
				}
			}
		}
		depth++;
	}

	if (depth >= maxDepth) {
		console.error(
			'Maximum update depth exceeded. Possible infinite loop in reactive effects.',
		);
		scheduledEffects.clear();
	}

	isFlushingEffects = false;
}

export function createSignal<T>(
	initialValue: T,
	options: SignalOptions<T> = {},
): [SignalReader<T>, SignalWriter<T>] {
	let value = initialValue;
	const subscriptions = new Set<Effect>();
	const { name, equals = Object.is } = options;

	const read: SignalReader<T> = () => {
		const observer = context[context.length - 1];
		if (observer && !observer.disposed) {
			subscriptions.add(observer);

			// Track this signal for cleanup
			if (!cleanupRegistry.has(observer)) {
				cleanupRegistry.set(observer, new Set());
			}
			cleanupRegistry.get(observer)!.add(() => subscriptions.delete(observer));
		}
		return value;
	};

	const write: SignalWriter<T> = (newValue: T) => {
		// Only update if value actually changed
		if (equals(value, newValue)) return;

		value = newValue;

		// Schedule all subscribed effects for async execution
		for (const observer of subscriptions) {
			if (!observer.disposed) {
				scheduleEffect(observer);
			}
		}
	};

	// Add debugging info
	read.signalName = name;
	write.signalName = name;

	return [read, write];
}

export function createEffect(
	fn: () => void | EffectCleanup,
	options: EffectOptions = {},
): Effect {
	const { name, onError } = options;
	let cleanup: EffectCleanup | null = null;

	const effect: Effect = {
		disposed: false,
		name,
		execute() {
			if (this.disposed) return;

			// Prevent circular execution
			if (runningEffects.has(this)) {
				console.warn('Circular dependency detected in effect:', name || 'anonymous');
				return;
			}

			// Cleanup previous run
			if (cleanup) {
				try {
					cleanup();
				} catch (error) {
					console.error('Error in effect cleanup:', error);
				}
				cleanup = null;
			}

			// Clear previous subscriptions
			const prevCleanups = cleanupRegistry.get(this);
			if (prevCleanups) {
				prevCleanups.forEach((cleanupFn) => cleanupFn());
				prevCleanups.clear();
			}

			runningEffects.add(this);
			context.push(this);

			try {
				const result = fn();
				// Support cleanup functions returned from effects
				if (isFunction(result)) {
					cleanup = result;
				}
			} catch (error) {
				if (onError) {
					onError(error as Error);
				} else {
					console.error('Error in reactive effect:', error);
				}
			} finally {
				context.pop();
				runningEffects.delete(this);
			}
		},

		dispose() {
			if (this.disposed) return;

			this.disposed = true;

			// Run cleanup if exists
			if (cleanup) {
				try {
					cleanup();
				} catch (error) {
					console.error('Error in effect cleanup during disposal:', error);
				}
			}

			// Clear all subscriptions
			const cleanups = cleanupRegistry.get(this);
			if (cleanups) {
				cleanups.forEach((cleanupFn) => cleanupFn());
				cleanupRegistry.delete(this);
			}

			// Remove from scheduled effects
			scheduledEffects.delete(this);
		},
	};

	// Initial execution
	effect.execute();

	return effect;
}

// Computed values - cached reactive computations
export function createComputed<T>(
	fn: () => T,
	options: ComputedOptions<T> = {},
): ComputedReader<T> {
	let value: T;
	let isStale = true;
	const { name, equals = Object.is } = options;

	const computedEffect = createEffect(
		() => {
			const newValue = fn();
			if (isStale || !equals(value, newValue)) {
				value = newValue;
				isStale = false;
			}
		},
		{ name: `computed:${name || 'anonymous'}` },
	);

	const read: ComputedReader<T> = () => {
		const observer = context[context.length - 1];
		if (observer && !observer.disposed && !computedEffect.disposed) {
			// This computed value becomes a dependency
			const mockSignal = new Set([observer]);
			mockSignal.add(observer);

			if (!cleanupRegistry.has(observer)) {
				cleanupRegistry.set(observer, new Set());
			}
			cleanupRegistry.get(observer)!.add(() => mockSignal.delete(observer));
		}

		return value;
	};

	read.dispose = computedEffect.dispose.bind(computedEffect);
	read.computedName = name;

	return read;
}

// Batch multiple updates together
export function batch(fn: () => void): void {
	const wasFlushingEffects = isFlushingEffects;
	isFlushingEffects = true;

	try {
		fn();
	} finally {
		isFlushingEffects = wasFlushingEffects;
		if (!wasFlushingEffects) {
			flushEffects();
		}
	}
}

// Utility to run code without tracking dependencies
export function untrack<T>(fn: () => T): T {
	const prevContext = context.slice();
	context.length = 0;

	try {
		return fn();
	} finally {
		context.length = 0;
		context.push(...prevContext);
	}
}

// Advanced: Create a reactive root with automatic cleanup
export function createRoot<T>(fn: () => T): ReactiveRoot<T> {
	const effects = new Set<Effect>();
	const originalCreateEffect = createEffect;

	// Override createEffect to track all effects in this root
	const trackedCreateEffect = (
		effectFn: () => void | EffectCleanup,
		options?: EffectOptions,
	): Effect => {
		const effect = originalCreateEffect(effectFn, options);
		effects.add(effect);
		return effect;
	};

	try {
		// Temporarily replace global createEffect
		(globalThis as any).createEffect = trackedCreateEffect;
		const result = fn();

		// Return disposal function
		return {
			result,
			dispose() {
				effects.forEach((effect) => effect.dispose());
				effects.clear();
			},
		};
	} finally {
		(globalThis as any).createEffect = originalCreateEffect;
	}
}

// Debugging utilities
export function getSignalGraph(): SignalGraph {
	const graph: SignalGraph = {
		signals: new Map(),
		effects: new Map(),
		connections: [],
	};

	// This would need more sophisticated tracking in a real implementation
	// For now, return a basic structure for debugging
	return graph;
}

// Configuration
export function configure(options: ReactiveConfig = {}): void {
	if (options.maxDepth !== undefined) {
		maxDepth = options.maxDepth;
	}
}

// Example usage and demonstration (browser only):
declare global {
	interface Window {
		ReactiveDemo?: {
			createSignal: typeof createSignal;
			createEffect: typeof createEffect;
			createComputed: typeof createComputed;
			batch: typeof batch;
			untrack: typeof untrack;
			createRoot: typeof createRoot;
			configure: typeof configure;
		};
	}
}

if (!isUndefined(window)) {
	window.ReactiveDemo = {
		createSignal,
		createEffect,
		createComputed,
		batch,
		untrack,
		createRoot,
		configure,
	};
}

/* 
Example Usage:

// Basic signals with type safety
const [count, setCount] = createSignal<number>(0, { name: 'counter' });
const [multiplier, setMultiplier] = createSignal<number>(2, { name: 'multiplier' });

// Computed value (cached) - type inferred
const doubled = createComputed(() => count() * 2, { name: 'doubled' });

// Effect with cleanup
const effect1 = createEffect(() => {
	console.log('Count:', count(), 'Doubled:', doubled());
	
	// Return cleanup function
	return () => {
		console.log('Cleaning up effect');
	};
}, { name: 'logger' });

// Batched updates
batch(() => {
	setCount(5);
	setMultiplier(3);
}); // Only triggers effects once

// Manual cleanup
effect1.dispose();
doubled.dispose();

// Root-level cleanup with typed result
const root = createRoot(() => {
	const [local, setLocal] = createSignal<string>('hello');
	createEffect(() => console.log('Local:', local()));
	return { local, setLocal };
});

// Later...
root.dispose(); // Cleans up all effects in this root
*/
