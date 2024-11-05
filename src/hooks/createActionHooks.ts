import { useFetchStore } from '../Context/dataFetchContext';

enum FETCH_TYPE {
	FETCH_INIT = 'FETCH_INIT',
	FETCH_SUCCESS = 'FETCH_SUCCESS',
	FETCH_FAILURE = 'FETCH_FAILURE',
	FETCH_STOP = 'FETCH_STOP',
	UPDATE_INIT = 'UPDATE_INIT',
	UPDATE_SUCCESS = 'UPDATE_SUCCESS',
	UPDATE_FAILURE = 'UPDATE_FAILURE',
	UPDATE_STOP = 'UPDATE_STOP',
	ADVANCE_PAGE = 'ADVANCE_PAGE',
	FILTER_BY_TEXT = 'FILTER_BY_TEXT',
}

export type FetchActionType = { type: FETCH_TYPE; schema: string; payload?: any };

export const createActionHooks = (schema: string) => {
	const { dispatch } = useFetchStore();

	const sendDispatch = (type: FETCH_TYPE, payload?: any) => {
		const dispatchObj: FetchActionType = { schema, type, payload };
		dispatch(dispatchObj);
	};

	return {
		useFetchActions: () => ({
			fetchStarted: () => sendDispatch(FETCH_TYPE.FETCH_INIT),
			fetchSucceeded: (payload: any) => sendDispatch(FETCH_TYPE.FETCH_SUCCESS, payload),
			fetchFailed: () => sendDispatch(FETCH_TYPE.FETCH_FAILURE),
			fetchCompleted: () => sendDispatch(FETCH_TYPE.FETCH_STOP),
		}),

		useUpdateActions: () => ({
			updateStarted: () => sendDispatch(FETCH_TYPE.UPDATE_INIT),
			updateSucceeded: () => sendDispatch(FETCH_TYPE.UPDATE_SUCCESS),
			updateFailed: () => sendDispatch(FETCH_TYPE.UPDATE_FAILURE),
			updateCompleted: () => sendDispatch(FETCH_TYPE.UPDATE_STOP),
		}),

		usePageActions: () => ({
			advancePage: (payload: any) => sendDispatch(FETCH_TYPE.ADVANCE_PAGE, payload),
		}),

		searchActions: () => ({
			filterByText: (payload: any) => sendDispatch(FETCH_TYPE.FILTER_BY_TEXT, payload),
		}),
	};
};
