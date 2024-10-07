interface Data {
	results?: any[];
	[key: string]: any;
}

interface Action {
	type: string;
	payload?: Data;
}

interface State {
	isLoading?: boolean;
	isError?: boolean;
	data?: Data;
	[key: string]: any;
}

const infiniteScrollReducer = (state: State, action: Action): State | null => {
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
			const filterText = payload?.filterText || '';
			return {
				...state,
				data: {
					...state.data,
					results:
						state.data?.results?.filter(({ title }) =>
							title.includes(filterText),
						) || [],
				},
			};

		default:
			return null;
	}
};

export default infiniteScrollReducer;
