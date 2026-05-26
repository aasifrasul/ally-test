import { useCallback, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export enum ActionStatus {
	Idle = 'idle',
	Loading = 'loading',
	Success = 'success',
	Error = 'error',
}

type IdleState<T, F> = {
	status: ActionStatus.Idle;
	data: T | undefined; // may hold stale data from a previous run
	error: undefined;
	formData: Partial<F>;
};

type LoadingState<T, F> = {
	status: ActionStatus.Loading;
	data: T | undefined; // may hold stale data from a previous run
	error: undefined;
	formData: F;
};

type SuccessState<T, F> = {
	status: ActionStatus.Success;
	data: T; // guaranteed — the only state where data is definite
	error: undefined;
	formData: Partial<F>;
};

type ErrorState<T, F> = {
	status: ActionStatus.Error;
	data: T | undefined; // may hold stale data from a previous run
	error: Error;
	formData: F; // preserved for form repopulation on failure
};

type ActionState<T, F> =
	| IdleState<T, F>
	| LoadingState<T, F>
	| SuccessState<T, F>
	| ErrorState<T, F>;

export type UseAsyncActionReturn<T, F> = ActionState<T, F> & {
	isPending: boolean;
	isIdle: boolean;
	isSuccess: boolean;
	isError: boolean;
	execute: (formData: F) => Promise<T>;
	reset: () => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useActionState<T, F extends Record<string, unknown>>(
	serverAction: (formData: F) => Promise<T>,
	initialFormData?: Partial<F>,
): UseAsyncActionReturn<T, F> {
	// Stable ref so callers can pass inline functions without forcing
	// execute/reset to be recreated on every render.
	const serverActionRef = useRef(serverAction);
	serverActionRef.current = serverAction;

	// Stable ref so reset() and execute() always see the latest initialFormData
	// without needing it in their dependency arrays.
	const initialFormDataRef = useRef(initialFormData);
	initialFormDataRef.current = initialFormData;

	const [state, setState] = useState<ActionState<T, F>>({
		status: ActionStatus.Idle,
		data: undefined,
		error: undefined,
		formData: initialFormData ?? {},
	});

	// Tracks the latest request — incremented on each execute/reset so stale
	// in-flight responses are silently discarded.
	const requestIdRef = useRef(0);

	const execute = useCallback(async (formData: F): Promise<T> => {
		const requestId = ++requestIdRef.current;

		setState((prev) => ({
			...prev,
			status: ActionStatus.Loading,
			error: undefined,
			formData,
		}));

		try {
			const data = await serverActionRef.current(formData);

			if (requestId !== requestIdRef.current) {
				// A newer call has superseded this one — discard silently.
				// We still need to return *something* that satisfies Promise<T>,
				// but the caller's .then will never run because the component
				// that triggered this call has already moved on.
				return data;
			}

			setState((prev) => ({
				...prev,
				status: ActionStatus.Success,
				data,
				error: undefined,
				formData: initialFormDataRef.current ?? {},
			}));

			return data;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));

			if (requestId === requestIdRef.current) {
				setState((prev) => ({
					...prev,
					status: ActionStatus.Error,
					error,
					formData,
				}));
			}

			// Always rethrow — callers that await execute() can handle errors
			// locally without having to watch the error field in state.
			throw error;
		}
	}, []);

	const reset = useCallback(() => {
		// Invalidate any in-flight request before clearing state so its result
		// doesn't land after the reset.
		requestIdRef.current++;

		setState({
			status: ActionStatus.Idle,
			data: undefined,
			error: undefined,
			formData: initialFormDataRef.current ?? {},
		});
	}, []);

	return {
		...state,
		isPending: state.status === ActionStatus.Loading,
		isIdle: state.status === ActionStatus.Idle,
		isSuccess: state.status === ActionStatus.Success,
		isError: state.status === ActionStatus.Error,
		execute,
		reset,
	};
}
