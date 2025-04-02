import { RabbitMQClient } from './RabbitMQClient';

// Example of sending an image to the queue
async function sendImageToQueue(imagePath: string): Promise<void> {
	const rabbitClient = RabbitMQClient.getInstance();

	try {
		await rabbitClient.connect();
		const queue = 'image_processing_queue';

		const success = await rabbitClient.sendToQueue(queue, Buffer.from(imagePath));

		if (success) {
			console.log(`Sent ${imagePath} to queue`);
		} else {
			console.error('Failed to send message to queue');
		}

		// Close connection after a delay if needed
		// In a real application, you might want to keep the connection open
		setTimeout(() => {
			rabbitClient.closeConnection();
		}, 500);
	} catch (error) {
		console.error('Error sending image to queue:', error);
	}
}

// Example of consuming images from the queue
async function consumeImageFromQueue(): Promise<void> {
	const rabbitClient = RabbitMQClient.getInstance();

	try {
		await rabbitClient.connect();
		const queue = 'image_processing_queue';

		console.log('Waiting for messages...');

		const consumerTag = await rabbitClient.consumeFromQueue(queue, (msg) => {
			if (msg !== null) {
				const imagePath = msg.content.toString();
				console.log(`Processing image: ${imagePath}`);

				// Perform image processing here (e.g., resizing, compression)
				console.log(`Image ${imagePath} processed.`);

				// Acknowledge message after processing
				rabbitClient.acknowledgeMessage(msg);
			}
		});

		// To stop consuming (if needed):
		// await rabbitClient.cancelConsumer(consumerTag);
		// await rabbitClient.closeConnection();
	} catch (error) {
		console.error('Error consuming from queue:', error);
	}
}

// Usage examples
// sendImageToQueue('/path/to/my/image.jpg');
// consumeImageFromQueue();
