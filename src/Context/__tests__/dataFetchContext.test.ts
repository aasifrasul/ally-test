import { act } from 'react-test-renderer';
import { renderHook } from '@testing-library/react-hooks';

import { FetchStoreProvider, useFetchStore } from '../dataFetchContext';
import { ActionType, Schema } from '../../constants/types';

const schema = Schema.INFINITE_SCROLL;

describe('useFetchStore', () => {
	it('should return the correct state', () => {
		const { result } = renderHook(() => useFetchStore());
		expect(result.current).toEqual({
			isLoading: false,
			isError: false,
			data: [],
			currentPage: 0,
			TOTAL_PAGES: 0,
		});
	});

	it('should return the correct state after dispatch', () => {
		const { result } = renderHook(() => useFetchStore());
		act(() => {
			result.current.dispatch({ schema, type: ActionType.FETCH_INIT });
		});
		expect(result.current).toEqual({
			isLoading: true,
			isError: false,
			data: [],
			currentPage: 0,
			TOTAL_PAGES: 0,
		});
	});
});
