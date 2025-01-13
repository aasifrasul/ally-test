type Result<T> = { success: true; data: T } | { success: false; error: Error };

export const handleAsyncCalls = async <T>(promise: Promise<T>): Promise<Result<T>> => {
	try {
		const data = await promise;
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
};
