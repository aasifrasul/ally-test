import { useCallback } from 'react';

import { invalidateCache, updateCache } from '../client';

export { useQuery } from './useQuery';
export { useLazyQuery } from './useLazyQuery';
export { useMutation } from './useMutation';
export { useSubscription } from './useSubscription';

export function useInvalidateCache() {
	return useCallback((pattern?: string) => {
		invalidateCache(pattern);
	}, []);
}

export function useUpdateCache() {
	return useCallback((query: string, variables: any, updater: (data: any) => any) => {
		updateCache(query, variables, updater);
	}, []);
}
