import dataFetchReducer from '../dataFetchReducer';
import { GenericState, GenericAction, Schema, ActionType } from '../../constants/types';
import { constants } from '../../constants';

// Mock the entire constants module
jest.mock('../../constants', () => ({
	...jest.requireActual('../../constants'),
	constants: {
		dataSources: {
			[Schema.INFINITE_SCROLL]: {
				reducer: jest.fn(),
				BASE_URL: 'http://example.com',
				schema: Schema.INFINITE_SCROLL,
			},
		},
	},
}));

describe('dataFetchReducer', () => {
	// Mock schema and initial states
	const MOCK_SCHEMA = Schema.INFINITE_SCROLL;
	const mockInitialState: GenericState = {
		[MOCK_SCHEMA]: {
			isLoading: false,
			isUpdating: false,
			isError: false,
			data: [],
			currentPage: 1,
		},
	};

	// Mock custom reducer callback
	const mockCustomReducer = jest.fn();

	beforeEach(() => {
		// Reset mocks
		jest.resetAllMocks();
	});

	afterEach(() => {
		// Clear all mocks after each test
		jest.clearAllMocks();
	});

	describe('Custom reducer handling', () => {
		it('should use custom reducer when it returns a valid object', () => {
			const customState = {
				isLoading: false,
				customField: 'test',
			};
			mockCustomReducer.mockReturnValue(customState);

			const action: GenericAction = {
				type: ActionType.ADVANCE_PAGE,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual(customState);
			expect(mockCustomReducer).toHaveBeenCalledWith(
				mockInitialState[MOCK_SCHEMA],
				action,
			);
		});

		it('should fall back to default reducer when custom reducer returns non-object', () => {
			mockCustomReducer.mockReturnValue(null);

			const action: GenericAction = {
				type: ActionType.FETCH_INIT,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA].isLoading).toBe(true);
		});
	});

	describe('Fetch actions', () => {
		it('should handle FETCH_INIT', () => {
			const action: GenericAction = {
				type: ActionType.FETCH_INIT,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isLoading: true,
				isError: false,
			});
		});

		it('should handle FETCH_SUCCESS with payload', () => {
			const payload = { id: 1, name: 'Test' };
			const action: GenericAction = {
				type: ActionType.FETCH_SUCCESS,
				schema: MOCK_SCHEMA,
				payload,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isLoading: false,
				data: payload,
			});
		});

		it('should handle FETCH_SUCCESS without payload', () => {
			const action: GenericAction = {
				type: ActionType.FETCH_SUCCESS,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isLoading: false,
			});
		});

		it('should handle FETCH_FAILURE', () => {
			const action: GenericAction = {
				type: ActionType.FETCH_FAILURE,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isLoading: false,
				isError: true,
			});
		});

		it('should handle FETCH_STOP', () => {
			const action: GenericAction = {
				type: ActionType.FETCH_STOP,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isLoading: false,
			});
		});
	});

	describe('Update actions', () => {
		it('should handle UPDATE_INIT', () => {
			const action: GenericAction = {
				type: ActionType.UPDATE_INIT,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isUpdating: true,
				isError: false,
			});
		});

		it('should handle UPDATE_SUCCESS', () => {
			const action: GenericAction = {
				type: ActionType.UPDATE_SUCCESS,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isUpdating: false,
			});
		});

		it('should handle UPDATE_FAILURE', () => {
			const action: GenericAction = {
				type: ActionType.UPDATE_FAILURE,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isUpdating: false,
				isError: true,
			});
		});

		it('should handle UPDATE_STOP', () => {
			const action: GenericAction = {
				type: ActionType.UPDATE_STOP,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...mockInitialState[MOCK_SCHEMA],
				isUpdating: false,
			});
		});
	});

	describe('Pagination', () => {
		it('should handle ADVANCE_PAGE with numeric payload', () => {
			const action: GenericAction = {
				type: ActionType.ADVANCE_PAGE,
				schema: MOCK_SCHEMA,
				payload: 3,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState[MOCK_SCHEMA].currentPage).toBe(3);
		});

		it('should handle ADVANCE_PAGE with non-numeric payload', () => {
			const currentState = {
				...mockInitialState,
				[MOCK_SCHEMA]: {
					...mockInitialState[MOCK_SCHEMA],
					currentPage: 5,
				},
			};

			const action: GenericAction = {
				type: ActionType.ADVANCE_PAGE,
				schema: MOCK_SCHEMA,
				payload: 'invalid',
			};

			const newState = dataFetchReducer(currentState, action);

			expect(newState[MOCK_SCHEMA]).toEqual({
				...currentState[MOCK_SCHEMA],
				currentPage: currentState[MOCK_SCHEMA].currentPage,
			});
		});
	});

	describe('Edge cases', () => {
		it('should handle unknown action type by returning current state', () => {
			const action: GenericAction = {
				type: ActionType.FILTER_BY_TEXT,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(mockInitialState, action);

			expect(newState).toEqual(mockInitialState);
		});

		it('should preserve other schemas in state', () => {
			const stateWithMultipleSchemas = {
				...mockInitialState,
				otherSchema: {
					isLoading: false,
					isUpdating: false,
					isError: false,
					data: [],
					currentPage: 1,
				},
			};

			const action: GenericAction = {
				type: ActionType.FETCH_INIT,
				schema: MOCK_SCHEMA,
			};

			const newState = dataFetchReducer(stateWithMultipleSchemas, action);

			expect(newState.otherSchema).toEqual(stateWithMultipleSchemas.otherSchema);
		});
	});
});
