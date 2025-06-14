import { isArray, isObject } from '../typeChecking';

// Proper Immer-like produce function with copy-on-write
interface DraftState {
	base: any;
	copy?: any;
	assigned: Set<string | symbol>;
	parent?: DraftState;
	revoked: boolean;
}

const DRAFT_STATE = Symbol('draft-state');

function isDraft(value: any): boolean {
	return value && value[DRAFT_STATE];
}

function getDraftState(draft: any): DraftState {
	return draft[DRAFT_STATE];
}

function createDraftState(base: any, parent?: DraftState): DraftState {
	return {
		base,
		copy: undefined,
		assigned: new Set(),
		parent,
		revoked: false,
	};
}

function prepareCopy(state: DraftState): any {
	if (!state.copy) {
		state.copy = isArray(state.base) ? [...state.base] : { ...state.base };
	}
	return state.copy;
}

function createDraft(base: any, parent?: DraftState): any {
	if (!isObject(base)) return base;

	const state = createDraftState(base, parent);

	const proxy = new Proxy(base, {
		get(target, prop) {
			if (prop === DRAFT_STATE) return state;

			const value = state.copy ? state.copy[prop] : state.base[prop];

			// Create nested drafts for object values
			if (isObject(value) && !isDraft(value)) {
				return createDraft(value, state);
			}

			return value;
		},

		set(target, prop, value) {
			if (state.revoked) {
				throw new Error('Cannot modify a finalized draft');
			}

			const copy = prepareCopy(state);
			copy[prop] = isDraft(value) ? finalize(value) : value;
			state.assigned.add(prop as string | symbol);
			return true;
		},

		deleteProperty(target, prop) {
			if (state.revoked) {
				throw new Error('Cannot modify a finalized draft');
			}

			const copy = prepareCopy(state);
			delete copy[prop];
			state.assigned.add(prop as string | symbol);
			return true;
		},

		defineProperty(target, prop, descriptor) {
			if (state.revoked) {
				throw new Error('Cannot modify a finalized draft');
			}

			const copy = prepareCopy(state);
			Object.defineProperty(copy, prop, descriptor);
			state.assigned.add(prop as string | symbol);
			return true;
		},
	});

	return proxy;
}

function finalize(draft: any): any {
	if (!isDraft(draft)) return draft;

	const state = getDraftState(draft);
	if (state.revoked) {
		throw new Error('Cannot finalize a revoked draft');
	}

	state.revoked = true;

	// If no changes were made, return the original base
	if (!state.copy) {
		return state.base;
	}

	// Recursively finalize nested objects
	const result = state.copy;
	for (const prop of state.assigned) {
		const value = result[prop];
		if (isDraft(value)) {
			result[prop] = finalize(value);
		}
	}

	return result;
}

export function produce<T extends object>(
	stateOrFn: T | ((draft: T) => void | T),
	maybeFn?: (draft: T) => void | T,
): T | ((state: T) => T) {
	// Curried version: produce(fn)(state)
	if (typeof stateOrFn === 'function' && !maybeFn) {
		const fn = stateOrFn as (draft: T) => void | T;
		return (state: T): T => {
			const draft = createDraft(state);
			const result = fn(draft);
			// If the function returns something, use that; otherwise use the mutated draft
			return result !== undefined ? result : finalize(draft);
		};
	}

	// Direct version: produce(state, fn)
	if (maybeFn) {
		const state = stateOrFn as T;
		const fn = maybeFn;
		const draft = createDraft(state);
		const result = fn(draft);
		return result !== undefined ? result : finalize(draft);
	}

	throw new Error('Invalid arguments to produce');
}
