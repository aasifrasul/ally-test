import { renderHook } from '@testing-library/react-hooks';

import { createStoreContext } from '../createStore';
import { ActionType, GenericAction, GenericState, Schema } from '../../constants/types';

describe('createStoreContext', () => {
	it('creates a typed provider and hook for schema-driven state', () => {
		const initialState: GenericState = {
			[Schema.INFINITE_SCROLL]: { data: [] },
		};

		const reducer = (state: GenericState, action: GenericAction): GenericState => {
			switch (action.type) {
				case ActionType.FETCH_SUCCESS:
					return {
						...state,
						[Schema.INFINITE_SCROLL]: {
							...state[Schema.INFINITE_SCROLL],
							data: [
								...((state[Schema.INFINITE_SCROLL]?.data as any[]) ?? []),
								action.payload,
							],
						},
					};
				default:
					return state;
			}
		};

		const [Provider, useStore] = createStoreContext(reducer, initialState);
		const { result } = renderHook(() => useStore(), {
			wrapper: ({ children }: { children: React.ReactNode }) => (
				<Provider>{children}</Provider>
			),
		});

		expect(result.current.dispatch).toBeInstanceOf(Function);
		expect(result.current.state[Schema.INFINITE_SCROLL]).toEqual({ data: [] });
	});

	it('preserves schema arrays as arrays when reading state', () => {
		const initialState: GenericState = {
			[Schema.INFINITE_SCROLL]: { data: [{ id: 1 }] },
		};

		const reducer = (state: GenericState, action: GenericAction): GenericState => {
			if (action.type !== ActionType.FETCH_SUCCESS) {
				return state;
			}

			return {
				...state,
				[Schema.INFINITE_SCROLL]: {
					...state[Schema.INFINITE_SCROLL],
					data: [
						...((state[Schema.INFINITE_SCROLL]?.data as any[]) ?? []),
						action.payload,
					],
				},
			};
		};

		const [Provider, useStore] = createStoreContext(reducer, initialState);
		const { result } = renderHook(() => useStore(), {
			wrapper: ({ children }: { children: React.ReactNode }) => (
				<Provider>{children}</Provider>
			),
		});

		result.current.dispatch({
			type: ActionType.FETCH_SUCCESS,
			payload: { id: 2 },
			schema: Schema.INFINITE_SCROLL,
		});

		const data = result.current.state[Schema.INFINITE_SCROLL].data as Array<{
			id: number;
		}>;
		expect(Array.isArray(data)).toBe(true);
		expect(data).toHaveLength(2);
		expect(data[0]).toEqual({ id: 1 });
		expect(data[1]).toEqual({ id: 2 });
	});
});
