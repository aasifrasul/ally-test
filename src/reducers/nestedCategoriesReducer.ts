import { InitialState, Action, ReducerFunction } from '../constants/types';

type Payload = {
	data?: any;
	[key: string]: any;
};

interface SpecificAction extends Action {
	payload?: Payload;
}

const nestedCategoriesReducer: ReducerFunction = (
	state: InitialState,
	action: SpecificAction,
): InitialState => {
	const type: string = action.type;
	const payload: Payload = action.payload ?? { data: [] };

	switch (type) {
		case 'FETCH_SUCCESS':
			return {
				...state,
				isLoading: false,
				isError: false,
				data: { ...state.data, ...payload.data },
			};

		default:
			return state;
	}
};

export default nestedCategoriesReducer;
