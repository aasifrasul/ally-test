import { safelyExecuteFunction } from '../utils/typeChecking';
import { constants } from '../utils/Constants';

const dataFetchReducer = (state = {}, action) => {
	const { schema } = action;
	const newState = {
		...state,
	};
	if (schema) {
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
