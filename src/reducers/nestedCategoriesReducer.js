const nestedCategoriesReducer = (state, action) => {
	const { type, payload } = action;
	const { data } = payload || {};
	switch (type) {
		case 'FETCH_SUCCESS':
			return {
				...state,
				isLoading: false,
				isError: false,
				data: { ...state.data, ...data },
			};

		default:
			return {
				...state,
			};
	}
};

export default nestedCategoriesReducer;
