const pageReducer = (state = {}, action) => {
	const { type, schema } = action;
	switch (type) {
		case 'ADVANCE_PAGE':
			const pageNum = (state[schema]?.pageNum || 0) + 1;
			return { ...state, [schema]: { pageNum } };
		default:
			return { ...state };
	}
};

export default pageReducer;
