const movieListReducer = (state, action) => {
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
			let filteredData = [];
			if (filterText) {
				filteredData = state?.data?.results.filter((item) => {
					return item.title?.toLowerCase().includes(filterText);
				});
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
