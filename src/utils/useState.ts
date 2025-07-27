// Types
interface Hook {
	memoizedState: any;
	next: Hook | null;
	queue?: UpdateQueue;
}

interface UpdateQueue {
	pending: Update | null;
}

interface Update {
	action: any;
	next: Update | null;
}

interface FiberNode {
	memoizedState: Hook | null; // Points to first hook in linked list
	updateQueue?: UpdateQueue;
	// ... other fiber properties
}

// Global state - React maintains these during rendering
let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let hookIndex = 0; // For debugging/understanding

// Helper to get current fiber
function getCurrentFiber(): FiberNode {
	if (!currentlyRenderingFiber) {
		throw new Error('Hooks can only be called inside components');
	}
	return currentlyRenderingFiber;
}

// Core hook creation/retrieval logic
function createOrGetHook(): Hook {
	const fiber = getCurrentFiber();

	if (workInProgressHook === null) {
		// This is the first hook in the component
		if (fiber.memoizedState === null) {
			// First render - create first hook
			const hook: Hook = { memoizedState: null, next: null };
			fiber.memoizedState = hook;
			workInProgressHook = hook;
		} else {
			// Subsequent render - start from first hook
			workInProgressHook = fiber.memoizedState;
		}
	} else {
		// This is not the first hook
		if (workInProgressHook.next === null) {
			// First render - create new hook and link it
			const hook: Hook = { memoizedState: null, next: null };
			workInProgressHook.next = hook;
			workInProgressHook = hook;
		} else {
			// Subsequent render - move to next existing hook
			workInProgressHook = workInProgressHook.next;
		}
	}

	return workInProgressHook;
}

// useState implementation
function useState<T>(
	initialState: T | (() => T),
): [T, (newState: T | ((prev: T) => T)) => void] {
	const hook = createOrGetHook();

	// Initialize state on first render
	if (hook.memoizedState === undefined) {
		hook.memoizedState =
			typeof initialState === 'function' ? (initialState as () => T)() : initialState;
	}

	const setState = (newState: T | ((prev: T) => T)) => {
		const currentState = hook.memoizedState;
		const nextState =
			typeof newState === 'function'
				? (newState as (prev: T) => T)(currentState)
				: newState;

		// Only update if state actually changed
		if (Object.is(nextState, currentState)) return;

		hook.memoizedState = nextState;

		// Schedule re-render (simplified - real React uses scheduler)
		scheduleWork(currentlyRenderingFiber!);
	};

	return [hook.memoizedState, setState];
}

// useEffect implementation (simplified)
function useEffect(effect: () => void | (() => void), deps?: any[]): void {
	const hook = createOrGetHook();

	// Initialize on first render
	if (hook.memoizedState === undefined) {
		hook.memoizedState = { deps: deps, cleanup: null };
		// Schedule effect to run after render
		scheduleEffect(() => {
			const cleanup = effect();
			hook.memoizedState.cleanup = cleanup;
		});
		return;
	}

	const prevDeps = hook.memoizedState.deps;
	const hasChanged =
		deps === undefined || !deps.every((dep, i) => Object.is(dep, prevDeps?.[i]));

	if (hasChanged) {
		// Run cleanup from previous effect
		if (hook.memoizedState.cleanup) {
			hook.memoizedState.cleanup();
		}

		// Schedule new effect
		scheduleEffect(() => {
			const cleanup = effect();
			hook.memoizedState = { deps, cleanup };
		});
	}
}

// Component render simulation
function renderComponent(component: () => any, fiber: FiberNode) {
	// Setup globals for this render
	currentlyRenderingFiber = fiber;
	workInProgressHook = null;
	hookIndex = 0;

	try {
		// Call the component function - this will call hooks
		const result = component();

		return result;
	} finally {
		// Cleanup globals
		currentlyRenderingFiber = null;
		workInProgressHook = null;
	}
}

// Simplified scheduler functions (real React is much more complex)
const effectQueue: (() => void)[] = [];

function scheduleEffect(effect: () => void) {
	effectQueue.push(effect);
}

function scheduleWork(fiber: FiberNode) {
	// In real React, this would trigger the reconciler
	console.log('Scheduling re-render for fiber', fiber);

	// Simulate async re-render
	setTimeout(() => {
		renderComponent(() => {
			// This would be the actual component function
			console.log('Re-rendering...');
		}, fiber);

		// Run effects
		while (effectQueue.length > 0) {
			const effect = effectQueue.shift()!;
			effect();
		}
	}, 0);
}

// Example usage simulation
function ExampleComponent() {
	const [count, setCount] = useState(0); // Hook #0
	const [name, setName] = useState('John'); // Hook #1

	useEffect(() => {
		// Hook #2
		console.log('Count changed:', count);
	}, [count]);

	return { count, name, setCount };
}

// Simulate component lifecycle
const componentFiber: FiberNode = { memoizedState: null };

console.log('=== First Render ===');
const result1 = renderComponent(ExampleComponent, componentFiber);
console.log('Result:', result1);

console.log('\n=== Second Render (after state change) ===');
// Simulate state change
result1.setCount(1);

// The key insight: Hook order must be consistent!
// This is why conditional hooks break everything:
/*
function BadComponent({ condition }: { condition: boolean }) {
  const [name] = useState('John');     // Hook #0 ✓
  
  if (condition) {
    const [age] = useState(25);        // Hook #1 (sometimes) ❌
  }
  
  const [email] = useState('a@b.com'); // Hook #1 or #2? ❌
}
*/
