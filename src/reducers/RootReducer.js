import { combineReducers } from 'redux';

import todoReducer from './todoReducer';
import dataFetchReducer from './dataFetchReducer';
import feedReducer from './feedReducer';

const RootReducer = combineReducers({
	todos: todoReducer,
	dataFetchReducer,
	feedReducer,
});

export default RootReducer;

/**
 * Internal implementation of combineReducers
 * 

function combineReducers(reducers) {
	return function combination(state = {}, action) {
		let hasChanged = false;
		const nextState = {};
		for (let key in reducers) {
			const previousStateForKey = state[key];
			const nextStateForKey = reducers[key](previousStateForKey, action);
			nextState[key] = nextStateForKey;
			hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
		}
		return hasChanged ? nextState : state;
	};
}


Immer's implementation

function produce(baseState, recipe) {
	const draft = createProxy(baseState);
	recipe(draft);
	return finalize(draft);
}

function createProxy(target) {
	return new Proxy(target, {
		set(obj, prop, value) {
			if (obj[prop] !== value) {
				markChanged(obj);
				obj[prop] = value;
			}
			return true;
		},
		// ... other trap implementations
	});
}

function finalize(draft) {
	if (!hasChanges(draft)) return baseState;
	return deepClone(draft);
}


Mobx's implementation

class Observable {
	constructor(value) {
		this.value = value;
		this.listeners = new Set();
	}

	get() {
		dependencyTracker.track(this);
		return this.value;
	}

	set(newValue) {
		if (this.value !== newValue) {
			this.value = newValue;
			this.listeners.forEach((listener) => listener());
		}
	}
}

const observable = (value) => new Observable(value);


Recoil's implementation

class Atom {
	constructor(key, defaultValue) {
		this.key = key;
		this.value = defaultValue;
		this.listeners = new Set();
	}

	get() {
		return this.value;
	}

	set(newValue) {
		if (this.value !== newValue) {
			this.value = newValue;
			this.listeners.forEach((listener) => listener());
		}
	}
}

function atom(options) {
	return new Atom(options.key, options.default);
}


Zustand'd implementation

function create(createState) {
	let state;
	const listeners = new Set();

	const setState = (partial, replace) => {
		const nextState = typeof partial === 'function' ? partial(state) : partial;
		if (nextState !== state) {
			state = replace ? nextState : { ...state, ...nextState };
			listeners.forEach((listener) => listener());
		}
	};

	const getState = () => state;

	const subscribe = (listener) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	};

	const api = { setState, getState, subscribe };
	state = createState(setState, getState, api);

	return api;
}

*/
