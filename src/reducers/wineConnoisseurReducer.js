const wineConnoisseurReducer = (state, action) => {
	const { type, payload } = action;
	switch (type) {
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

		default:
			return null;
	}
};

export default wineConnoisseurReducer;
