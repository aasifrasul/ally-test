// @args: You can pass your worker parameters on initialisation
export default function ImageDownloadWorker(args) {
	let onmessage = (event) => {
		// eslint-disable-line no-unused-vars
		if (typeof event.data === 'string') {
			const { ImageSrc } = JSON.parse(event.data) || {};

			ImageSrc &&
				fetch(ImageSrc)
					.then((response) => response.blob())
					.then((blob) => {
						const blobUrl = URL.createObjectURL(blob);
						postMessage(blobUrl);
					});
		}
	};
}
