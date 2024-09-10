const hashMapEndPoints: Map<string, () => void> = new Map();
const hashMapData: Map<string, any> = new Map();

interface FetchAPIDataOptions {
	endpoint: string;
	options?: RequestInit;
}

interface WorkerMessage {
	id: number;
	type: string;
	data: any;
}

async function handleLoadImages(id: number, imageUrls: string[]): Promise<void> {
	try {
		const promises = imageUrls.map(async (url) => {
			const req = new Request(url);
			const response = await fetch(req);
			const fileBlob = await response.blob();
			if (fileBlob.type === 'image/jpeg') {
				return URL.createObjectURL(fileBlob);
			}
			return null;
		});
		const loadedImages = await Promise.all(promises);
		self.postMessage({ id, type: 'loadImagesResponse', data: loadedImages });
	} catch (error: any) {
		self.postMessage({ id, type: 'loadImagesError', error: error.message });
	}
}

async function handleLoadImage(id: number, url: string): Promise<void> {
	try {
		const req = new Request(url);
		const response = await fetch(req);
		const fileBlob = await response.blob();
		if (fileBlob.type === 'image/jpeg') {
			const blobUrl = URL.createObjectURL(fileBlob);
			self.postMessage({ id, type: 'loadImageResponse', data: blobUrl });
		}
	} catch (error: any) {
		self.postMessage({ id, type: 'loadImageError', error: error.message });
	}
}

async function handleFetchAPIData(
	id: number,
	{ endpoint, options = {} }: FetchAPIDataOptions,
): Promise<void> {
	try {
		const abortController = new AbortController();
		const signal = abortController.signal;

		const isGetRequest = options.method?.toUpperCase() === 'GET';

		if (isGetRequest && hashMapData.has(endpoint)) {
			self.postMessage({
				id,
				type: 'fetchAPIDataResponse',
				data: hashMapData.get(endpoint),
			});
			return;
		}

		hashMapEndPoints.set(endpoint, () => abortController.abort());

		const enhancedOptions: RequestInit = {
			...options,
			signal,
		};

		const req = new Request(endpoint, enhancedOptions);

		const response = await fetch(req);
		const data = await response.json();
		self.postMessage({ id, type: 'fetchAPIDataResponse', data });
	} catch (error: any) {
		self.postMessage({ id, type: 'fetchAPIDataError', error: error.message });
	}
}

function handleAbortFetchRequest(id: number, data: any): void {
	self.postMessage({ id, type: 'abortFetchRequestResponse', data: 'Request aborted' });
}

self.onmessage = async (event: MessageEvent): Promise<void> => {
	const { id, type, data }: WorkerMessage = event.data;
	if (typeof id !== 'number' || typeof type !== 'string') {
		throw new Error('Invalid message format');
	}

	switch (type) {
		case 'fetchAPIData':
			await handleFetchAPIData(id, data);
			break;
		case 'loadImages':
			await handleLoadImages(id, data);
			break;
		case 'loadImage':
			await handleLoadImage(id, data);
			break;
		case 'abortFetchRequest':
			handleAbortFetchRequest(id, data);
			break;
		default:
			self.postMessage({ id, type: 'error', error: 'Unknown message type' });
	}
};
