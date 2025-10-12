import infiniteScrollReducer from '../infiniteScrollReducer';

import { ActionType, InitialState } from '../../constants/types';

import { mockUserData } from './infiniteScroll.testdata';

describe('infiniteScrollReducer', () => {
	const initialState: InitialState = {
		isLoading: true,
		isError: false,
		data: [],
	};

	describe('FETCH_SUCCESS action', () => {
		it('should append new data to existing data and update loading states', () => {
			const existingState: InitialState = {
				...initialState,
				data: [mockUserData[0]],
			};

			const action = {
				type: ActionType.FETCH_SUCCESS,
				payload: {
					results: [mockUserData[1]],
				},
			};

			const newState = infiniteScrollReducer(existingState, action);

			expect(newState).toEqual({
				isLoading: false,
				isError: false,
				data: [mockUserData[0], mockUserData[1]],
			});
		});

		it('should handle empty initial state', () => {
			const action = {
				type: ActionType.FETCH_SUCCESS,
				payload: {
					results: mockUserData,
				},
			};

			const newState = infiniteScrollReducer(initialState, action);

			expect(newState).toEqual({
				isLoading: false,
				isError: false,
				data: mockUserData,
			});
		});
	});

	describe('FILTER_BY_TEXT action', () => {
		it('should filter data by name', () => {
			const existingState: InitialState = {
				...initialState,
				data: mockUserData,
			};

			const action = {
				type: ActionType.FILTER_BY_TEXT,
				payload: {
					filterText: 'Jeremy',
				},
			};

			const newState = infiniteScrollReducer(existingState, action);

			expect(newState).toEqual({
				...existingState,
				data: [mockUserData[0]],
			});
		});

		it('should filter data by Email', () => {
			const existingState: InitialState = {
				...initialState,
				data: mockUserData,
			};

			const action = {
				type: ActionType.FILTER_BY_TEXT,
				payload: {
					filterText: 'Rosas',
				},
			};

			const newState = infiniteScrollReducer(existingState, action);

			expect(newState).toEqual({
				...existingState,
				data: [mockUserData[1]],
			});
		});

		it('should handle empty filter text', () => {
			const existingState: InitialState = {
				...initialState,
				data: mockUserData,
			};

			const action = {
				type: ActionType.FILTER_BY_TEXT,
				payload: {
					filterText: '',
				},
			};

			const newState = infiniteScrollReducer(existingState, action);

			expect(newState).toEqual({
				...existingState,
				data: mockUserData,
			});
		});

		it('should return empty array when no matches found', () => {
			const existingState: InitialState = {
				...initialState,
				data: mockUserData,
			};

			const action = {
				type: ActionType.FILTER_BY_TEXT,
				payload: {
					filterText: 'NonExistent',
				},
			};

			const newState = infiniteScrollReducer(existingState, action);

			expect(newState).toEqual({
				...existingState,
				data: [],
			});
		});
	});
});
