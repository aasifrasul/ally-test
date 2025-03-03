import { useCallback, useState, useTransition } from 'react';

enum ActionState {
	IDLE = 'idle',
	LOADING = 'loading',
	SUCCESS = 'success',
	ERROR = 'error',
}

export function useActionState<T, FormData extends Record<string, any>>(
	serverAction: (formData: FormData) => Promise<T>,
	initialState?: Partial<FormData>,
) {
	const [isPending, startTransition] = useTransition();
	const [state, setState] = useState<{
		data?: T;
		error?: Error;
		status: ActionState;
		formData: Partial<FormData>;
	}>({
		status: ActionState.IDLE,
		formData: initialState || {},
	});

	const formAction = useCallback(
		async (formData: FormData) => {
			setState((prev) => ({ ...prev, status: ActionState.LOADING }));

			// Fix: Separate the async logic from the transition
			startTransition(() => {
				// Wrap in an IIFE to handle the async work
				(async () => {
					try {
						const data = await serverAction(formData);
						setState({
							data,
							status: ActionState.SUCCESS,
							formData: initialState || {},
						});
					} catch (error) {
						setState((prev) => ({
							...prev,
							error: error as Error,
							status: ActionState.ERROR,
							formData,
						}));
					}
				})();
			});
		},
		[serverAction, initialState, startTransition],
	);

	return [
		{
			...state,
			isPending,
			isLoading: state.status === ActionState.LOADING || isPending,
			isSuccess: state.status === ActionState.SUCCESS,
			isError: state.status === ActionState.ERROR,
		},
		formAction,
	] as const;
}
