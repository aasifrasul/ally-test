const movieListReducer = (state, action) => {
	const { type, payload } = action;
	switch (type) {
		case 'FETCH_INIT':
			return {
				...state,
				isLoading: true,
				isError: false,
			};
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
		case 'FETCH_FAILURE':
			return {
				...state,
				isLoading: false,
				isError: true,
			};
		case 'FETCH_STOP':
			return {
				...state,
				isLoading: false,
			};
		case 'FILTER_BY_TEXT':
			const filterText = payload?.filterText?.toLowerCase() || '';
			const filteredData =
				(filterText && state?.data?.results.filter(({ title }) => title?.toLowerCase().includes(filterText))) ||
				{};
			return {
				...state,
				originalData: filterText ? state?.data : {},
				data: filterText ? filteredData : state?.originalData,
			};
		default:
			return {
				...state,
			};
	}
};

export default movieListReducer;
