// --- Type Definitions ---

/** A standard reducer function: (accumulator, current) => nextAccumulator */
export type Reducer<Acc, Cur> = (accumulator: Acc, current: Cur) => Acc;

/** A transducer transforms one reducer into another: Reducer -> Reducer */
export type Transducer<Acc, Cur, NextAcc = Acc, NextCur = Cur> = (
	reducer: Reducer<NextAcc, NextCur>,
) => Reducer<Acc, Cur>;

/**
 * Creates a mapping transducer.
 * @param fn - The mapping function.
 */
export const map = <Cur, MappedCur>(
	fn: (current: Cur) => MappedCur,
): Transducer<any, Cur, any, MappedCur> => {
	return (reducer) => {
		return (accumulator, current) => {
			return reducer(accumulator, fn(current));
		};
	};
};

/**
 * Creates a filtering transducer.
 * @param predicate - The filtering condition.
 */
export const filter = <Cur>(
	predicate: (current: Cur) => boolean,
): Transducer<any, Cur, any, Cur> => {
	return (reducer) => {
		return (accumulator, current) => {
			return predicate(current) ? reducer(accumulator, current) : accumulator;
		};
	};
};

// --- Composition Overloads ---

export function pipe<A, B>(f: A): A;
export function pipe<A, B, C>(f: (arg: A) => B, g: (arg: B) => C): (arg: A) => C;
export function pipe<A, B, C, D>(
	f: (arg: A) => B,
	g: (arg: B) => C,
	h: (arg: C) => D,
): (arg: A) => D;
export function pipe(...fns: Function[]): Function {
	return fns.reduce(
		(f, g) =>
			(...args: any[]) =>
				g(f(...args)),
	);
}

// Alias for right-to-left mathematical composition if preferred
export function compose(...fns: Function[]): Function {
	return fns.reduceRight(
		(f, g) =>
			(...args: any[]) =>
				g(f(...args)),
	);
}

/**
 * Standard array appending reducer.
 */
export const arrayReducer: Reducer<any[], any> = (acc, val) => [...acc, val];

/**
 * Executes a synchronous transducer over a collection.
 *
 * @example
 * const processNumbers = pipe(
 *   map((x: number) => x * 2),
 *   filter((x: number) => x > 10)
 * );
 * const result = transduce(processNumbers, arrayReducer, [], [1, 5, 8, 10]);
 */
export const transduce = <Acc, Cur, CollectionItem>(
	transducer: Transducer<Acc, CollectionItem, Acc, Cur>,
	reducer: Reducer<Acc, Cur>,
	initialValue: Acc,
	collection: CollectionItem[],
): Acc => {
	const transformedReducer = transducer(reducer);
	return collection.reduce(transformedReducer, initialValue);
};

/**
 * Asynchronous transduce function to properly handle async mappers/filters.
 */
export const transduceAsync = async <Acc, Cur, CollectionItem>(
	transducer: Transducer<Acc, CollectionItem, Acc, Cur>,
	reducer: Reducer<Acc, Cur>,
	initialValue: Acc,
	collection: CollectionItem[],
): Promise<Acc> => {
	let accumulator = initialValue;
	const step = transducer(reducer);

	for (const item of collection) {
		accumulator = await step(accumulator, item);
	}

	return accumulator;
};
