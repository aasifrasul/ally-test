self.addEventListener(
	'message',
	(event) => {
		const { endpoint, params } = event.data;

		endpoint &&
			fetch(endpoint, params)
				.then((response) => response.json())
				.then((data) => {
					console.log('worker data', data);
					self.postMessage({ type: 'apiResponse', data });
				});
	},
	false,
);
