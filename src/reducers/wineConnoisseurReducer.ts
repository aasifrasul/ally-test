import { ActionType, InitialState, Action, ReducerFunction } from '../constants/types';

type Payload = {
	pageData: any[];
	headers: any;
	[key: string]: any;
};

interface SpecificAction extends Action {
	payload?: Payload;
}

const wineConnoisseurReducer: ReducerFunction = (
	state: InitialState,
	action: SpecificAction,
): InitialState => {
	const type: string = action.type;
	const payload: Payload = action.payload ?? { pageData: [], headers: [] };

	switch (type) {
		case ActionType.FETCH_SUCCESS:
			const pageData = [...(state.pageData || []), ...(payload.pageData || [])];
			const headers = [...(state.headers || []), ...(payload.headers || [])];
			return {
				...state,
				isLoading: false,
				isError: false,
				pageData,
				headers,
			};

		default:
			return state;
	}
};

export default wineConnoisseurReducer;
