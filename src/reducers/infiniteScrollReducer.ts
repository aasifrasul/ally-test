import { type IS_UserData } from '../types/api';
import { InitialState, Action, ReducerFunction } from '../constants/types';

type Payload = {
	filterText?: string;
	results: IS_UserData[];
};

interface SpecificAction extends Action {
	payload?: Payload;
}

const infiniteScrollReducer: ReducerFunction = (
	state: InitialState,
	action: SpecificAction,
): InitialState => {
	const type: string = action.type;
	const payload: Payload = action.payload ?? { results: [] };

	switch (type) {
		case 'FETCH_SUCCESS':
			const currentData: IS_UserData[] = payload.results;
			const originalData: IS_UserData[] = (state?.data as IS_UserData[]) || [];
			return {
				...state,
				isLoading: false,
				isError: false,
				data: [...originalData, ...currentData],
			};

		case 'FILTER_BY_TEXT':
			const filterText = payload?.filterText || '';
			return {
				...state,
				data:
					(state?.data as IS_UserData[]).filter(
						({ name }) =>
							name.first.includes(filterText) || name.last.includes(filterText),
					) || [],
			};

		default:
			return state;
	}
};

export default infiniteScrollReducer;
