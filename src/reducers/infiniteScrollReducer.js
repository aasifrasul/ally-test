const infiniteScrollReducer = (state, action) => {
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
			return {
				...state,
				data: state.data.filter(({ title }) => title.includes(filterText)),
			};

		default:
			return null;
	}
};

export default infiniteScrollReducer;
