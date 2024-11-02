type DispatchType = (action: { schema: string; type: string; payload?: any }) => void;

let dispatch: DispatchType;

interface CustomDispatchEvent extends Event {
	detail: {
		dispatch: DispatchType;
	};
}

window.addEventListener('customDispatch', (e: CustomDispatchEvent) => {
	dispatch = e.detail.dispatch;
});

const sendDispatch = (schema: string, type: string, payload?: any) => {
	if (dispatch) {
		dispatch({ schema, type, payload });
	} else {
		console.error('Dispatch function is not initialized.');
	}
};

export const fetchStarted = (schema: string) => sendDispatch(schema, 'FETCH_INIT');
export const fetchSucceeded = (schema: string, payload: any) =>
	sendDispatch(schema, 'FETCH_SUCCESS', payload);
export const fetchFailed = (schema: string) => sendDispatch(schema, 'FETCH_FAILURE');
export const fetchCompleted = (schema: string) => sendDispatch(schema, 'FETCH_COMPLETE');

export const updateStarted = (schema: string) => sendDispatch(schema, 'UPDATE_INIT');
export const updateSucceeded = (schema: string) => sendDispatch(schema, 'UPDATE_SUCCESS');
export const updateFailed = (schema: string) => sendDispatch(schema, 'UPDATE_FAILURE');
export const updateCompleted = (schema: string) => sendDispatch(schema, 'UPDATE_COMPLETE');

export const advancePage = (schema: string, payload: any) =>
	sendDispatch(schema, 'ADVANCE_PAGE', payload);
