import { useEffect, useState } from 'react';

export function useCsrfToken() {
	const [csrfToken, setCsrfToken] = useState<string>('');

	useEffect(() => {
		fetch('/api/csrf-token')
			.then((response) => response.json())
			.then((data) => setCsrfToken(data.csrfToken));
	}, []);

	return csrfToken;
}
