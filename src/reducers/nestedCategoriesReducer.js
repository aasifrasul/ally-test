const nestedCategoriesReducer = (state, action) => {
	const { type, payload } = action;
	const { data } = payload || {};
	switch (type) {
		case 'FETCH_INIT':
			return {
				...state,
				isLoading: true,
				isError: false,
				data: {},
			};
		case 'FETCH_SUCCESS':
			return {
				...state,
				isLoading: false,
				isError: false,
				data: { ...state.data, ...data },
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
		case 'ADVANCE_PAGE':
			return {
				...state,
				currentPage: state.currentPage + 1,
			};
		default:
			return {
				...state,
			};
	}
};

export default nestedCategoriesReducer;
