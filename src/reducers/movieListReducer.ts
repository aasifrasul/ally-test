import { Movie_Item } from '../types/movieList';
import { InitialState, Action, ReducerFunction } from '../constants/types';

type Payload = {
	filterText?: string;
	results: Movie_Item[];
};

interface SpecificAction extends Action {
	payload?: Payload;
}

const movieListReducer: ReducerFunction = (
	state: InitialState,
	action: SpecificAction,
): InitialState => {
	const type: string = action.type;
	const payload: Payload = action.payload ?? { results: [] };

	switch (type) {
		case 'FETCH_SUCCESS':
			const originalData: Movie_Item[] = (state?.data as Movie_Item[]) || [];
			const currentData = payload?.results || [];
			return {
				...state,
				isLoading: false,
				isError: false,
				data: [...originalData, ...currentData],
			};

		case 'FILTER_BY_TEXT':
			const filterText = payload?.filterText?.trim().toLowerCase() || '';
			let filteredData: any[] = [];
			if (filterText) {
				filteredData =
					(state?.data as Movie_Item[])?.filter((item: Movie_Item) => {
						return item.title?.toLowerCase().includes(filterText);
					}) || [];
			}

			return {
				...state,
				originalData: filterText ? (state?.data as Movie_Item[]) : {},
				data: filterText ? filteredData : state?.originalData,
			};

		default:
			return {
				...state,
			};
	}
};

export default movieListReducer;
