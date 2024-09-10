import WorkerMessageQueue from './WorkerMessageQueue';

const workerPath = new URL('./MyWorker.js', import.meta.url);
const worker = new Worker(workerPath, { type: 'module' });
const messageQueue = new WorkerMessageQueue(worker);

export const fetchAPIData = messageQueue.fetchAPIData.bind(messageQueue);
export const loadImages = messageQueue.loadImages.bind(messageQueue);
export const loadImage = messageQueue.loadImage.bind(messageQueue);
export const abortFetchRequest = messageQueue.abortFetchRequest.bind(messageQueue);
