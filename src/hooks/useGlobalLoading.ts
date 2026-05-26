import { useEffect, useState } from 'react';
import { subscribe, getPending } from '../utils/asyncTracker';

export function useGlobalLoading() {
	const [pending, setPending] = useState(getPending());

	useEffect(() => subscribe(setPending), []);

	return pending;
}
