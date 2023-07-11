self.addEventListener(
	'message',
	(event) => {
		if (typeof event.data === 'string') {
			const { type, data } = JSON.parse(event.data) || {};

			switch (type) {
				case 'fetchAPIData':
					return handleFetchAPIData(data);
				case 'loadImages':
					return handleLoadImages(data);
				default:
					throw new Error('Some issue');
			}
		}

		function handleLoadImages(imageUrls) {
			const promises = imageUrls.map(async (url) => {
				try {
					const response = await fetch(url);
					const fileBlob = response.blob();
					if (fileBlob.type === 'image/jpeg') {
						return URL.createObjectURL(fileBlob);
					}
				} catch (e) {
					return null;
				}
			});

			Promise.all(promises).then((data) =>
				postMessage({ type: 'loadImagesResponse', data })
			);
		}

		function handleFetchAPIData({ endpoint, options }) {
			try {
				const req = new Request(endpoint, options);

				req.signal.addEventListener('abort', () => {
					console.log('abort');
				});

				fetch(req)
					.then((response) => {
						if (response.status == 200) {
							return response.json();
						} else {
							throw new Error(response);
						}
					})
					.then((data) => {
						postMessage({ type: 'fetchAPIDataResponse', data });
					});
			} catch (error) {
				console.log(error);
			}
		}
	},
	false
);
