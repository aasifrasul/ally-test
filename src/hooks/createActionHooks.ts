import { useFetchStore } from '../Context/dataFetchContext';
import { ActionType, GenericAction } from '../constants/types';

export const createActionHooks = (schema: string) => {
	const { dispatch } = useFetchStore();

	const sendDispatch = (type: ActionType, payload?: any) => {
		const dispatchObj: GenericAction = { schema, type, payload };
		dispatch(dispatchObj);
	};

	return {
		useFetchActions: () => ({
			fetchStarted: () => sendDispatch(ActionType.FETCH_INIT),
			fetchSucceeded: (payload: any) => sendDispatch(ActionType.FETCH_SUCCESS, payload),
			fetchFailed: () => sendDispatch(ActionType.FETCH_FAILURE),
			fetchCompleted: () => sendDispatch(ActionType.FETCH_STOP),
		}),

		useUpdateActions: () => ({
			updateStarted: () => sendDispatch(ActionType.UPDATE_INIT),
			updateSucceeded: () => sendDispatch(ActionType.UPDATE_SUCCESS),
			updateFailed: () => sendDispatch(ActionType.UPDATE_FAILURE),
			updateCompleted: () => sendDispatch(ActionType.UPDATE_STOP),
		}),

		usePageActions: () => ({
			advancePage: (payload: any) => sendDispatch(ActionType.ADVANCE_PAGE, payload),
		}),

		searchActions: () => ({
			filterByText: (payload: any) => sendDispatch(ActionType.FILTER_BY_TEXT, payload),
		}),
	};
};
