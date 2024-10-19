import { APIService } from '../services/APIService';
import { ImageService } from '../services/ImageService';
import { createLogger } from '../utils/logger';
import { WorkerMessage } from '../types/api';

const ctx: Worker = self as any;

const apiService = new APIService();
const imageService = new ImageService();
const logger = createLogger('Worker');

function isValidWorkerMessage(message: any): message is WorkerMessage {
	return (
		message &&
		typeof message === 'object' &&
		'id' in message &&
		'type' in message &&
		'data' in message
	);
}

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
