interface Action {
	type: string;
	payload?: {
		data?: any;
		[key: string]: any;
	};
}

interface State {
	isLoading?: boolean;
	isError?: boolean;
	data?: any;
	[key: string]: any;
}

const nestedCategoriesReducer = (state: State, action: Action): State | null => {
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
			return null;
	}
};

export default nestedCategoriesReducer;
