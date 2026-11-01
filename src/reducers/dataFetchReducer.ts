import { constants } from '../constants';

import {
	ActionType,
	GenericState,
	GenericAction,
	GenericReducer,
	DataSource,
	ReducerFunction,
	Schema,
} from '../constants/types';
import { toArrayData } from '../utils/common';

const dataFetchReducer: GenericReducer = (
	state: GenericState,
	action: GenericAction,
): GenericState => {
	const { schema, type, payload } = action;
	const newState: GenericState = {
		...state,
	};

	let individualState = {
		...newState[schema],
	};

	switch (type) {
		case ActionType.FETCH_INIT:
			individualState = {
				...individualState,
				isLoading: true,
				isError: false,
			};
			break;

		case ActionType.FETCH_FAILURE:
			individualState = {
				...individualState,
				isLoading: false,
				isError: true,
			};
			break;

		case ActionType.FETCH_SUCCESS: {
			const resolvedData = toArrayData(payload);
			const existingData = Array.isArray(individualState.data)
				? individualState.data
				: [];
			const existingOriginalData = Array.isArray(individualState.originalData)
				? individualState.originalData
				: existingData;

			individualState = {
				...individualState,
				isLoading: false,
			};
			if (resolvedData) {
				const accumulated = [...existingOriginalData, ...resolvedData];
				individualState = {
					...individualState,
					data: accumulated,
					originalData: accumulated,
				};
			}
			break;
		}

		case ActionType.FETCH_STOP:
			individualState = {
				...individualState,
				isLoading: false,
			};
			break;

		case ActionType.UPDATE_INIT:
			individualState = {
				...individualState,
				isUpdating: true,
				isError: false,
			};
			break;

		case ActionType.UPDATE_FAILURE:
			individualState = {
				...individualState,
				isUpdating: false,
				isError: true,
			};
			break;

		case ActionType.UPDATE_SUCCESS:
			individualState = {
				...individualState,
				isUpdating: false,
			};
			break;

		case ActionType.UPDATE_STOP:
			individualState = {
				...individualState,
				isUpdating: false,
			};
			break;

		case ActionType.ADVANCE_PAGE:
			const currentPage = Number.isInteger(payload)
				? payload
				: individualState.currentPage;
			individualState = {
				...individualState,
				currentPage,
			};
			break;

		default:
			individualState = {
				...individualState,
			};
	}

	const dataSource: DataSource = constants.dataSources![schema as Schema];
	const reducerCB: ReducerFunction | undefined = dataSource.reducer;

	if (reducerCB !== undefined) {
		const otherState = reducerCB(individualState, action);
		individualState = { ...individualState, ...otherState };
	}

	newState[schema] = { ...individualState };
	return newState;
};

export default dataFetchReducer;
