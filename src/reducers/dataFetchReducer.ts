import { safelyExecuteFunction, isObject } from '../utils/typeChecking';
import { constants } from '../constants';

import { StoreSchema } from '../Context/types';

interface Action {
	schema: string;
	type: string;
	payload?: any;
}

const dataFetchReducer = (state: StoreSchema, action: Action): StoreSchema => {
	const { schema, type, payload } = action;
	const newState: StoreSchema = {
		...state,
	};

	const otherState = safelyExecuteFunction(
		constants.dataSources[schema]?.reducer,
		null,
		newState[schema],
		action,
	);

	if (isObject(otherState)) {
		newState[schema] = {
			...otherState,
		};
	} else {
		switch (type) {
			case 'FETCH_INIT':
				newState[schema] = {
					...newState[schema],
					isLoading: true,
					isError: false,
				};
				break;

			case 'FETCH_FAILURE':
				newState[schema] = {
					...newState[schema],
					isLoading: false,
					isError: true,
				};
				break;

			case 'FETCH_SUCCESS':
				newState[schema] = {
					...newState[schema],
					isLoading: false,
				};
				if (payload) {
					newState[schema].data = payload;
				}
				break;

			case 'FETCH_COMPLETE':
				newState[schema] = {
					...newState[schema],
					isLoading: false,
				};
				break;

			case 'UPDATE_INIT':
				newState[schema] = {
					...newState[schema],
					isUpdating: true,
					isError: false,
				};
				break;

			case 'UPDATE_FAILURE':
				newState[schema] = {
					...newState[schema],
					isUpdating: false,
					isError: true,
				};
				break;

			case 'UPDATE_SUCCESS':
				newState[schema] = {
					...newState[schema],
					isUpdating: false,
				};
				break;

			case 'UPDATE_STOP':
				newState[schema] = {
					...newState[schema],
					isUpdating: false,
				};
				break;

			case 'ADVANCE_PAGE':
				newState[schema] = {
					...newState[schema],
					currentPage: payload,
				};
				break;

			default:
				newState[schema] = {
					...newState[schema],
				};
		}
	}

	return newState;
};

export default dataFetchReducer;
