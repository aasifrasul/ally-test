interface Action {
	type: string;
	payload?: {
		pageData?: any[];
		headers?: any;
		[key: string]: any;
	};
}

interface State {
	isLoading?: boolean;
	isError?: boolean;
	data?: {
		pageData?: any[];
		headers?: any;
		[key: string]: any;
	};
	[key: string]: any;
}

const wineConnoisseurReducer = (state: State, action: Action): State | null => {
	const { type, payload } = action;
	switch (type) {
		case 'FETCH_SUCCESS':
			let { pageData = [], headers } = state?.data || {};
			pageData = [...pageData, ...(payload?.pageData || [])];
			headers = headers || payload?.headers;
			return {
				...state,
				isLoading: false,
				isError: false,
				data: {
					pageData,
					headers,
				},
			};

		default:
			return state;
	}
};

export default wineConnoisseurReducer;
