const hashMapEndPoints = new Map();
const hashMapData = new Map();

function handleLoadImages(type, imageUrls) {
	const promises = imageUrls.map(async (url) => {
		try {
			const req = new Request(url);
			const response = await fetch(req);
			const fileBlob = response.blob();
			if (fileBlob.type === 'image/jpeg') {
				return URL.createObjectURL(fileBlob);
			}
		} catch (e) {
			return null;
		}
	});

	Promise.all(promises).then((data) => postMessage({ type: `${type}Response`, data }));
}

async function handleFetchAPIData(type, { endpoint, options = {} }) {
	const abortController = new AbortController();
	const signal = abortController.signal;

	if (hashMapData.has(endpoint)) {
		postMessage({ type: `${type}Response`, data: hashMapData.get(endpoint) });
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
		postMessage({ type: `${type}Response`, data });
		hashMapData.set(endpoint, data);
	} catch (error) {
		throw new Error(error);
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

const globalObject = typeof self !== 'undefined' ? self : global;

globalObject.addEventListener(
	'message',
	(event) => {
		const { type, data } = event?.data || {};

		switch (type) {
			case 'fetchAPIData':
				return handleFetchAPIData(type, data);
			case 'loadImages':
				return handleLoadImages(type, data);
			case 'abortFetchRequest':
				return handleAbortFetchRequest(data);
			default:
				throw new Error('Some issue');
		}
	},
	false
);
