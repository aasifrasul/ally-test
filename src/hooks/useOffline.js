import React from 'react';

function useOffline() {
	const [isOffline, setIsOffline] = React.useState(false);

	const onOnline = () => setIsOffline(false);
	const onOffline = () => setIsOffline(true);

	React.useEffect(() => {
		window.addEventListener('offline', onOffline);
		window.addEventListener('online', onOnline);

		return () => {
			window.removeEventListener('offline', onOffline);
			window.removeEventListener('online', onOnline);
		};
	}, []);

	return isOffline;
}

export default useOffline;
