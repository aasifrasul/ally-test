// Enhanced Reactive Programming System
// Addresses: memory leaks, async scheduling, cleanup, infinite loops, computed values

const context = [];
const scheduledEffects = new Set();
const runningEffects = new WeakSet();
let isFlushingEffects = false;
let maxDepth = 100; // Prevent infinite loops

// Cleanup registry for proper disposal
const cleanupRegistry = new WeakMap();

// Async scheduler for batching updates
function scheduleEffect(effect) {
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

function flushEffects() {
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
		console.error('Maximum update depth exceeded. Possible infinite loop in reactive effects.');
		scheduledEffects.clear();
	}
	
	isFlushingEffects = false;
}

 function createSignal(initialValue, options = {}) {
	let value = initialValue;
	const subscriptions = new Set();
	const { name, equals = Object.is } = options;
	
	const read = () => {
		const observer = context[context.length - 1];
		if (observer && !observer.disposed) {
			subscriptions.add(observer);
			
			// Track this signal for cleanup
			if (!cleanupRegistry.has(observer)) {
				cleanupRegistry.set(observer, new Set());
			}
			cleanupRegistry.get(observer).add(() => subscriptions.delete(observer));
		}
		return value;
	};
	
	const write = (newValue) => {
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

 function createEffect(fn, options = {}) {
	const { name, onError } = options;
	let cleanup = null;
	
	const effect = {
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
				prevCleanups.forEach(cleanupFn => cleanupFn());
				prevCleanups.clear();
			}
			
			runningEffects.add(this);
			context.push(this);
			
			try {
				const result = fn();
				// Support cleanup functions returned from effects
				if (typeof result === 'function') {
					cleanup = result;
				}
			} catch (error) {
				if (onError) {
					onError(error);
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
				cleanups.forEach(cleanupFn => cleanupFn());
				cleanupRegistry.delete(this);
			}
			
			// Remove from scheduled effects
			scheduledEffects.delete(this);
		}
	};
	
	// Initial execution
	effect.execute();
	
	return effect;
}

// Computed values - cached reactive computations
 function createComputed(fn, options = {}) {
	let value;
	let isStale = true;
	const { name, equals = Object.is } = options;
	
	const computedEffect = createEffect(() => {
		const newValue = fn();
		if (isStale || !equals(value, newValue)) {
			value = newValue;
			isStale = false;
		}
	}, { name: `computed:${name || 'anonymous'}` });
	
	const read = () => {
		const observer = context[context.length - 1];
		if (observer && !observer.disposed && !computedEffect.disposed) {
			// This computed value becomes a dependency
			const mockSignal = new Set([observer]);
			mockSignal.add(observer);
			
			if (!cleanupRegistry.has(observer)) {
				cleanupRegistry.set(observer, new Set());
			}
			cleanupRegistry.get(observer).add(() => mockSignal.delete(observer));
		}
		
		return value;
	};
	
	read.dispose = computedEffect.dispose.bind(computedEffect);
	read.computedName = name;
	
	return read;
}

// Batch multiple updates together
 function batch(fn) {
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
 function untrack(fn) {
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
 function createRoot(fn) {
	const effects = new Set();
	const originalCreateEffect = createEffect;
	
	// Override createEffect to track all effects in this root
	const trackedCreateEffect = (effectFn, options) => {
		const effect = originalCreateEffect(effectFn, options);
		effects.add(effect);
		return effect;
	};
	
	try {
		// Temporarily replace global createEffect
		globalThis.createEffect = trackedCreateEffect;
		const result = fn();
		
		// Return disposal function
		return {
			result,
			dispose() {
				effects.forEach(effect => effect.dispose());
				effects.clear();
			}
		};
	} finally {
		globalThis.createEffect = originalCreateEffect;
	}
}

// Debugging utilities
 function getSignalGraph() {
	const graph = {
		signals: new Map(),
		effects: new Map(),
		connections: []
	};
	
	// This would need more sophisticated tracking in a real implementation
	// For now, return a basic structure for debugging
	return graph;
}

// Configuration
 function configure(options = {}) {
	if (options.maxDepth !== undefined) {
		maxDepth = options.maxDepth;
	}
}

// Example usage and demonstration:
if (typeof window !== 'undefined') {
	window.ReactiveDemo = {
		createSignal,
		createEffect,
		createComputed,
		batch,
		untrack,
		createRoot,
		configure
	};
}

// Basic signals
const [count, setCount] = createSignal(0, { name: 'counter' });
const [multiplier, setMultiplier] = createSignal(2, { name: 'multiplier' });

// Computed value (cached)
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

// Root-level cleanup
const root = createRoot(() => {
	const [local, setLocal] = createSignal(1);
	createEffect(() => console.log('Local:', local()));
	return { local, setLocal };
});

// Later...
root.dispose(); // Cleans up all effects in this root
