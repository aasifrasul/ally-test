import { IS_Item } from '../types/infiniteScroll';
import { ActionType, InitialState, Action, ReducerFunction } from '../constants/types';
import { toArrayData } from '../utils/common';

type Payload = {
	filterText?: string;
	results?: IS_Item[];
	data?: unknown;
};

interface SpecificAction extends Action {
	payload?: Payload | IS_Item[] | Record<string, unknown>;
}

const extractResults = <T>(payload: unknown): T[] => toArrayData<T>(payload);

const infiniteScrollReducer: ReducerFunction = (
	state: InitialState,
	action: SpecificAction,
): InitialState => {
	const type: string = action.type;
	const payload = action.payload ?? { results: [] };

	switch (type) {
		case ActionType.FETCH_SUCCESS: {
			const incoming = extractResults<IS_Item>(payload);
			const existingData: IS_Item[] = Array.isArray(state.data)
				? (state.data as IS_Item[])
				: [];
			const originalData: IS_Item[] = Array.isArray(state.originalData)
				? (state.originalData as IS_Item[])
				: existingData;
			const accumulated = [...originalData, ...incoming];

			return {
				...state,
				isLoading: false,
				isError: false,
				originalData: accumulated,
				data: accumulated,
			};
		}

		case ActionType.FILTER_BY_TEXT: {
			const filterText = String((payload as Payload)?.filterText ?? '')
				.trim()
				.toLowerCase();
			const originalData = (
				Array.isArray(state.originalData) ? state.originalData : state.data
			) as IS_Item[];

			return {
				...state,
				data: filterText
					? originalData.filter(({ name }) => {
							const first = String(name?.first ?? '').toLowerCase();
							const last = String(name?.last ?? '').toLowerCase();
							return first.includes(filterText) || last.includes(filterText);
						})
					: originalData,
			};
		}

		default:
			return state;
	}
};

export default infiniteScrollReducer;
