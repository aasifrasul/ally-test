import { useEffect, useReducer } from 'react';
import { useAsyncFactory } from '../Context/AsyncFactoryContext';

export function useAsyncByKey<T>(key: string, fn: () => Promise<T>) {
	const factory = useAsyncFactory<T>();
	const [, forceRender] = useReducer((x) => x + 1, 0);

	// Sync UI with Factory changes
	useEffect(() => {
		return factory.subscribe(forceRender);
	}, [factory, key]);

	// Trigger the async call
	useEffect(() => {
		let isCurrent = true;

		factory.runWithKey(key, fn).catch(() => {
			if (isCurrent) forceRender(); // Ensure render on failure
		});

		return () => {
			isCurrent = false;
		};
	}, [factory, key, fn]);

	const deferred = factory.get(key);

	return {
		loading: !deferred || deferred.isPending,
		data: deferred?.isResolved ? (deferred.result as T) : null,
		error: deferred?.isRejected ? deferred.result : null,
		// Optional: helper to manually trigger a refresh
		refresh: () => {
			factory.remove(key);
			factory.runWithKey(key, fn);
		},
	};
}
