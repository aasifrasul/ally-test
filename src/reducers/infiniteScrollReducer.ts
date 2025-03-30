import { IS_Item } from '../types/infiniteScroll';
import { ActionType, InitialState, Action, ReducerFunction } from '../constants/types';

type Payload = {
	filterText?: string;
	results: IS_Item[];
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
		case ActionType.FETCH_SUCCESS:
			const currentData: IS_Item[] = payload.results;
			const originalData: IS_Item[] = (state?.data as IS_Item[]) || [];
			return {
				...state,
				isLoading: false,
				isError: false,
				data: [...originalData, ...currentData],
			};

		case ActionType.FILTER_BY_TEXT:
			const filterText = payload?.filterText || '';
			return {
				...state,
				data:
					(state?.data as IS_Item[]).filter(
						({ name }) =>
							name.first.includes(filterText) || name.last.includes(filterText),
					) || [],
			};

		default:
			return state;
	}
};

export default infiniteScrollReducer;
