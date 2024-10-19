import { constants } from '../constants';

import {
	GenericState,
	GenericAction,
	GenericReducer,
	DataSource,
	ReducerFunction,
} from '../constants/types';

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
		case 'FETCH_INIT':
			individualState = {
				...individualState,
				isLoading: true,
				isError: false,
			};
			break;

		case 'FETCH_FAILURE':
			individualState = {
				...individualState,
				isLoading: false,
				isError: true,
			};
			break;

		case 'FETCH_SUCCESS':
			individualState = {
				...individualState,
				isLoading: false,
			};
			if (payload?.data) {
				individualState = {
					...individualState,
					data: [
						...(Array.isArray(individualState.data) ? individualState.data : []),
						...payload.data,
					],
				};
			}
			break;

		case 'FETCH_COMPLETE':
			individualState = {
				...individualState,
				isLoading: false,
			};
			break;

		case 'UPDATE_INIT':
			individualState = {
				...individualState,
				isUpdating: true,
				isError: false,
			};
			break;

		case 'UPDATE_FAILURE':
			individualState = {
				...individualState,
				isUpdating: false,
				isError: true,
			};
			break;

		case 'UPDATE_SUCCESS':
			individualState = {
				...individualState,
				isUpdating: false,
			};
			break;

		case 'UPDATE_STOP':
			individualState = {
				...individualState,
				isUpdating: false,
			};
			break;

		case 'ADVANCE_PAGE':
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

	const dataSource: DataSource = constants.dataSources![schema];
	const reducerCB: ReducerFunction | undefined = dataSource.reducer;

	if (reducerCB !== undefined) {
		const otherState = reducerCB(individualState, action);
		individualState = { ...individualState, ...otherState };
	}

	newState[schema] = { ...individualState };
	return newState;
};

export default dataFetchReducer;
