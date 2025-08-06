import { APIService } from '../services/APIService';
import { ImageService } from '../services/ImageService';
import { createLogger } from '../utils/Logger';
import { WorkerMessage } from '../types/api';
import { isObject } from '../utils/typeChecking';

const ctx: Worker = self as any;

const apiService = APIService.getInstance();
const imageService = ImageService.getInstance();
const logger = createLogger('Worker');
const messageKeys = ['id', 'type', 'data'];

const isValidWorkerMessage = (message: any): message is WorkerMessage =>
	isObject(message) && messageKeys.every((key) => key in message);

ctx.addEventListener('message', async (event: MessageEvent) => {
	const message = event.data;

	if (!isValidWorkerMessage(message)) {
		ctx.postMessage({
			id: 0,
			type: 'error',
			error: 'Invalid message format',
		});
		return;
	}

	const { id, type, data } = message;

	try {
		switch (type) {
			case 'fetchAPIData':
				const response = await apiService.fetch(data.endpoint, data.options);
				ctx.postMessage({ id, type: 'fetchAPIDataResponse', data: response });
				break;

			case 'loadImages':
				const images = await imageService.loadMultiple(data);
				ctx.postMessage({ id, type: 'loadImagesResponse', data: images });
				break;

			case 'loadImage':
				const image = await imageService.load(data);
				ctx.postMessage({ id, type: 'loadImageResponse', data: image });
				break;

			case 'abortFetchRequest':
				apiService.abort(data);
				ctx.postMessage({
					id,
					type: 'abortFetchRequestResponse',
					data: 'Request aborted',
				});
				break;

			default:
				throw new Error(`Unknown message type: ${type}`);
		}
	} catch (error) {
		logger.error(`Error processing ${type}:`, error);
		ctx.postMessage({
			id,
			type: `${type}Error`,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});
