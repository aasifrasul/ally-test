import { render } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import storeFactory from '../storeFactory';
import { Schema, GenericAction, GenericState, InitialState } from '../../constants/types';

describe('storeFactory', () => {
	const testReducer = (state: GenericState, action: GenericAction): GenericState => {
		switch (action.type) {
			case 'ADD_DATA':
				return {
					...state,
					[Schema.INFINITE_SCROLL]: {
						...state[Schema.INFINITE_SCROLL],
						data: [
							...((state[Schema.INFINITE_SCROLL]?.data as unknown[]) ?? []),
							action.payload,
						],
					},
				};
			default:
				return state;
		}
	};

	const initialState: InitialState = {
		data: [],
	};

	const genericState: GenericState = {
		[Schema.INFINITE_SCROLL]: initialState,
	};

	it('should return a tuple with a Provider and a hook', () => {
		const [Provider, useStore] = storeFactory<GenericState>(testReducer, genericState);
		expect(Provider).toBeDefined();
		expect(useStore).toBeDefined();
	});

	it('should return a Provider component', () => {
		const [Provider] = storeFactory<GenericState>(testReducer, genericState);
		expect(Provider).toBeInstanceOf(Function);
	});

	it('should return a hook', () => {
		const [Provider, useStore] = storeFactory<GenericState>(testReducer, genericState);
		const { result } = renderHook(() => useStore(), {
			wrapper: (props: { children: React.ReactNode }) => (
				<Provider>{props.children}</Provider>
			),
		});
		expect(result.current).toBeDefined();
	});

	it('should return a Provider component with children', () => {
		const [Provider] = storeFactory<GenericState>(testReducer, genericState);
		const children = <div>Test</div>;
		const { getByText } = render(<Provider>{children}</Provider>);
		expect(getByText('Test')).toBeInTheDocument();
	});

	it('should return a hook that throws error when used outside Provider', () => {
		const [, useStore] = storeFactory<GenericState>(testReducer, genericState);
		const { result } = renderHook(() => useStore());
		expect(result.error).toEqual(
			Error('useContext must be used within a StoreContext.Provider'),
		);
	});

	it('should return a hook that returns an object with a dispatch function and a store object when used within Provider', () => {
		const [Provider, useStore] = storeFactory<GenericState>(testReducer, genericState);
		const { result } = renderHook(() => useStore(), {
			wrapper: (props: { children: React.ReactNode }) => (
				<Provider>{props.children}</Provider>
			),
		});
		expect(result.current.dispatch).toBeInstanceOf(Function);
		expect(result.current.store).toBeDefined();
	});

	it('should access state through proxy', () => {
		const [Provider, useStore] = storeFactory<GenericState>(testReducer, genericState);
		const { result } = renderHook(() => useStore(), {
			wrapper: (props: { children: React.ReactNode }) => (
				<Provider>{props.children}</Provider>
			),
		});
		const data: InitialState = (result.current.store as unknown as GenericState)[
			Schema.INFINITE_SCROLL
		];
		expect(data).toEqual({
			data: [],
		});
	});

	it('should maintain referential equality of store and dispatch between renders', () => {
		const [Provider, useStore] = storeFactory<GenericState>(testReducer, genericState);
		const { result, rerender } = renderHook(() => useStore(), {
			wrapper: (props: { children: React.ReactNode }) => (
				<Provider>{props.children}</Provider>
			),
		});

		const firstStoreRef = result.current.store;
		const firstDispatchRef = result.current.dispatch;

		rerender();

		expect(result.current.store).toBe(firstStoreRef);
		expect(result.current.dispatch).toBe(firstDispatchRef);
	});

	it('should update state when dispatch is called', () => {
		const [Provider, useStore] = storeFactory<GenericState>(testReducer, genericState);
		const { result } = renderHook(() => useStore(), {
			wrapper: (props: { children: React.ReactNode }) => (
				<Provider>{props.children}</Provider>
			),
		});

		act(() => {
			result.current.dispatch({
				schema: Schema.INFINITE_SCROLL,
				type: 'ADD_DATA',
				payload: { id: 1, value: 'test' },
			});
		});

		const data: InitialState = (result.current.store as unknown as GenericState)[
			Schema.INFINITE_SCROLL
		];
		expect(data).toEqual({
			data: [{ id: 1, value: 'test' }],
		});
	});
});
