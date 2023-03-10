const wineConnoisseurReducer = (state, action) => {
	const { type, payload } = action;
	switch (type) {
		case 'FETCH_INIT':
			return {
				...state,
				isLoading: true,
				isError: false,
			};
		case 'FETCH_SUCCESS':
			let { pageData = [], headers } = state?.data || {};
			pageData = [...pageData, ...payload.pageData];
			headers = headers || payload.headers;
			return {
				...state,
				isLoading: false,
				isError: false,
				data: {
					...{ pageData, headers },
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
			return {
				...state,
				data: state.data.filter(({ title }) => title.includes(filterText)),
			};
		default:
			return {
				...state,
			};
	}
};

export default wineConnoisseurReducer;
