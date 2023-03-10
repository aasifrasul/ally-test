const pageReducer = (state = {}, action) => {
	const { type, schema } = action;
	switch (type) {
		case 'ADVANCE_PAGE':
			const originalData = state[schema]?.pageNum || 0;
			return { ...state, [schema]: { pageNum: originalData + 1 } };
		default:
			return { ...state };
	}
};

export default pageReducer;
