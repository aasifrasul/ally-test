import { safelyExecuteFunction } from '../utils/typeChecking';
import { constants } from '../utils/Constants';

const dataFetchReducer = (state = {}, action) => {
	const { schema, type } = action;
	const newState = {
		...state,
	};

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

		case 'FETCH_STOP':
			newState[schema] = {
				...newState[schema],
				isLoading: false,
			};
			break;

		case 'ADVANCE_PAGE':
			newState[schema] = {
				...newState[schema],
				currentPage: state.currentPage + 1,
			};
			break;

		default:
			newState[schema] = safelyExecuteFunction(
				constants.dataFetchModules[schema]?.reducer,
				null,
				newState[schema],
				action,
			);
	}

	return newState;
};

export default dataFetchReducer;
