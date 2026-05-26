import { NetworkError, Result } from '../types/api';

export async function handleAsyncExecution<T>(
	operation: () => Promise<T>,
): Promise<Result<T>> {
	try {
		const data = await operation();
		return { success: true, data };
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			return {
				success: false,
				error: new NetworkError('Request aborted'),
			};
		}

		if (error instanceof TypeError) {
			return {
				success: false,
				error: new NetworkError(error.message),
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}
