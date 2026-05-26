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
		case ActionType.FETCH_SUCCESS: {
			const incoming: IS_Item[] = payload.results ?? [];
			const originalData: IS_Item[] = (state.originalData as IS_Item[]) ?? [];
			const accumulated = [...originalData, ...incoming];

			return {
				...state,
				isLoading: false,
				isError: false,
				originalData: accumulated, // ← source of truth grows
				data: accumulated, // ← filtered view resets to full for now
			};
		}

		case ActionType.FILTER_BY_TEXT: {
			const filterText = payload?.filterText ?? '';
			const originalData = (state.originalData as IS_Item[]) ?? [];

			return {
				...state,
				data: filterText
					? originalData.filter(
							({ name }) =>
								name.first.includes(filterText) ||
								name.last.includes(filterText),
						)
					: originalData,
			};
		}

		default:
			return state;
	}
};

export default infiniteScrollReducer;
