type InputSelector<State, Result> = (state: State, ...args: any[]) => Result;
type ResultFunc<Results extends any[], Result> = (...args: Results) => Result;

interface Selector<State, Result> {
	(state: State, ...args: any[]): Result;
}

export function createSelector<State, Results extends any[], Result>(
	inputSelectors: InputSelector<State, any>[],
	resultFunc: ResultFunc<Results, Result>,
): Selector<State, Result> {
	let lastInputs: any[] | null = null;
	let lastResult: Result | null = null;

	return function selector(state: State, ...args: any[]): Result {
		// Get current values from all input selectors
		const currentInputs = inputSelectors.map((fn) => fn(state, ...args));

		// If any input changed (using shallow equality)
		const hasChanged =
			!lastInputs || currentInputs.some((input, i) => input !== lastInputs![i]);

		if (hasChanged) {
			// Recompute only if inputs changed
			lastResult = resultFunc(...(currentInputs as Results));
			lastInputs = currentInputs;
		}

		return lastResult!;
	};
}
