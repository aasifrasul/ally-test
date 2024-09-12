interface Data {
	results?: any[];
	[key: string]: any;
}

interface Action {
	type: string;
	payload?:
		| (Data & {
				filterText?: string;
		  })
		| undefined;
}

interface State {
	isLoading?: boolean;
	isError?: boolean;
	data?: Data;
	originalData?: Data;
	[key: string]: any;
}

const movieListReducer = (state: State, action: Action): State => {
	const { type, payload } = action;
	switch (type) {
		case 'FETCH_SUCCESS':
			const originalData = state?.data?.results || [];
			const currentData = payload?.results || [];
			return {
				...state,
				isLoading: false,
				isError: false,
				data: {
					results: [...originalData, ...currentData],
				},
			};

		case 'FILTER_BY_TEXT':
			const filterText = payload?.filterText?.trim().toLowerCase() || '';
			let filteredData: any[] = [];
			if (filterText) {
				filteredData =
					state?.data?.results?.filter((item) => {
						return item.title?.toLowerCase().includes(filterText);
					}) || [];
			}

			return {
				...state,
				originalData: filterText ? state?.data : {},
				data: filterText ? { results: filteredData } : state?.originalData,
			};

		default:
			return {
				...state,
			};
	}
};

export default movieListReducer;
