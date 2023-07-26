//import { Storage } from '../utils/Storage';
//const storage = new Storage('map');

const hashMapEndPoints = new Map();
const hashMapData = new Map();

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

	Promise.all(promises).then((data) => postMessage({ type: 'loadImagesResponse', data }));
}

async function handleFetchAPIData({ endpoint, options = {} }) {
	const abortController = new AbortController();
	const signal = abortController.signal;

	if (hashMapData.has(endpoint)) {
		postMessage({ type: 'fetchAPIDataResponse', data: hashMapData.get(endpoint) });
		return;
	}

	hashMapEndPoints.set(endpoint, () => abortController.abort());

	const enhancedOptions = {
		...options,
		signal,
	};

	const req = new Request(endpoint, enhancedOptions);

	try {
		const res = await fetch(req);
		const data = await res.json();
		postMessage({ type: 'fetchAPIDataResponse', data });
		hashMapData.set(endpoint, data);
	} catch (error) {
		if (error?.name === 'AbortError') {
			console.log('Request Aborted', error);
			throw error;
		} else {
			postMessage({
				type: 'fetchError',
				data: error,
			});
		}
	} finally {
		hashMapEndPoints.delete(endpoint);
	}
}

function handleAbortFetchRequest(data) {
	if (hashMapEndPoints.has(data)) {
		const callback = hashMapEndPoints.get(data);
		hashMapEndPoints.delete(data);
		callback && callback();
	}
}

self.addEventListener(
	'message',
	(event) => {
		const { type, data } = event?.data || {};

		switch (type) {
			case 'fetchAPIData':
				return handleFetchAPIData(data);
			case 'loadImages':
				return handleLoadImages(data);
			case 'abortFetchRequest':
				return handleAbortFetchRequest(data);
			default:
				throw new Error('Some issue');
		}
	},
	false
);
