function useCallback(fn, dependencies) {
	if (!Array.isArray(dependencies)) {
		throw new Error('dependencies must be an array');
	}

	if (typeof fn !== 'function') {
		throw new Error('First Param should be a function');
	}

	let memoizedFn = null;
	let previousDependencies = null;

	return function (...args) {
		if (
			previousDependencies === null ||
			!shallowEqual(dependencies, previousDependencies)
		) {
			memoizedFn = fn;
			previousDependencies = dependencies;
		}
		return memoizedFn.apply(this, args);
	};
}

function shallowEqual(arr1, arr2) {
	if (arr1 === arr2) return true;
	if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
	for (let i = 0; i < arr1.length; i++) {
		if (arr1[i] !== arr2[i]) return false;
	}
	return true;
}
