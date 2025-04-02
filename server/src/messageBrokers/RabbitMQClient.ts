import * as amqp from 'amqplib';
import { constants } from '../constants';
import { logger } from '../Logger';

const { url, MAX_RETRIES, RETRY_DELAY } = constants.messagingLayer.rabbitMQConfig;

export class RabbitMQClient {
	private static instance: RabbitMQClient;
	private connection: amqp.Connection | null = null;
	private channel: amqp.Channel | null = null;
	private connected: boolean = false;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private initializing: boolean = false;
	private reconnectAttempts: number = 0;

	private constructor() {}

	public static getInstance(): RabbitMQClient {
		if (!RabbitMQClient.instance) {
			RabbitMQClient.instance = new RabbitMQClient();
		}
		return RabbitMQClient.instance;
	}

	public async connect(): Promise<void> {
		if (this.connected || this.initializing) {
			return; // Already connected or initializing, nothing to do
		}

		this.initializing = true;
		try {
			await this.connectWithRetry();
		} finally {
			this.initializing = false;
		}
	}

	private async connectWithRetry(): Promise<void> {
		try {
			this.connection = await amqp.connect(url);

			this.connection.on('error', (err: Error) => {
				logger.error('RabbitMQ Connection Error', err);
				this.connected = false;
				this.scheduleReconnect();
			});

			this.connection.on('close', () => {
				logger.info('RabbitMQ connection closed');
				this.connected = false;
				this.channel = null;
				this.scheduleReconnect();
			});

			logger.info('RabbitMQ connection established');

			this.channel = await this.connection.createChannel();
			logger.info('RabbitMQ channel created');

			this.reconnectAttempts = 0;
			this.connected = true;
		} catch (err) {
			logger.error('RabbitMQ connection attempt failed:', err);
			this.connected = false;
			this.scheduleReconnect();
		}
	}

	private async scheduleReconnect(): Promise<void> {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		const maxReconnectAttempts = MAX_RETRIES ?? 5;

		if (this.reconnectAttempts >= maxReconnectAttempts) {
			logger.error(`RabbitMQ connection failed after ${maxReconnectAttempts} attempts`);
			return;
		}

		const delay = Math.min(
			Math.pow(2, this.reconnectAttempts) * (RETRY_DELAY ?? 1000),
			30000,
		);
		logger.info(
			`RabbitMQ reconnect scheduled in ${delay}ms, attempt: ${this.reconnectAttempts + 1}/${maxReconnectAttempts}`,
		);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectAttempts++;
			this.connectWithRetry();
		}, delay);
	}

	public isReady(): boolean {
		return this.connected && this.channel !== null;
	}

	public async assertQueue(
		queue: string,
		options: amqp.Options.AssertQueue = { durable: true },
	): Promise<amqp.Replies.AssertQueue | null> {
		if (!this.isReady()) {
			logger.error('Cannot assert queue: RabbitMQ not ready');
			return null;
		}

		try {
			return await this.channel!.assertQueue(queue, options);
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to assert queue: ${errorMessage}`);
			return null;
		}
	}

	public async sendToQueue(
		queue: string,
		content: Buffer,
		options: amqp.Options.Publish = { persistent: true },
	): Promise<boolean> {
		if (!this.isReady()) {
			logger.error('Cannot send to queue: RabbitMQ not ready');
			return false;
		}

		try {
			await this.assertQueue(queue);
			const result = this.channel!.sendToQueue(queue, content, options);
			logger.debug(`Message sent to queue: ${queue}`);
			return result;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to send message to queue: ${errorMessage}`);
			return false;
		}
	}

	public async consumeFromQueue(
		queue: string,
		onMessage: (msg: amqp.ConsumeMessage | null) => void,
		options: amqp.Options.Consume = { noAck: false },
	): Promise<string | null> {
		if (!this.isReady()) {
			logger.error('Cannot consume from queue: RabbitMQ not ready');
			return null;
		}

		try {
			await this.assertQueue(queue);
			const { consumerTag } = await this.channel!.consume(queue, onMessage, options);
			logger.info(`Consumer started for queue: ${queue} with tag: ${consumerTag}`);
			return consumerTag;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to consume from queue: ${errorMessage}`);
			return null;
		}
	}

	public async acknowledgeMessage(message: amqp.ConsumeMessage): Promise<boolean> {
		if (!this.isReady()) {
			logger.error('Cannot acknowledge message: RabbitMQ not ready');
			return false;
		}

		try {
			this.channel!.ack(message);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to acknowledge message: ${errorMessage}`);
			return false;
		}
	}

	public async cancelConsumer(consumerTag: string): Promise<boolean> {
		if (!this.isReady()) {
			logger.error('Cannot cancel consumer: RabbitMQ not ready');
			return false;
		}

		try {
			await this.channel!.cancel(consumerTag);
			logger.info(`Consumer canceled: ${consumerTag}`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to cancel consumer: ${errorMessage}`);
			return false;
		}
	}

	public async closeConnection(): Promise<void> {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.channel) {
			try {
				await this.channel.close();
				logger.info('RabbitMQ channel closed');
			} catch (err) {
				logger.error('Error closing RabbitMQ channel:', err);
			}
			this.channel = null;
		}

		if (this.connection) {
			try {
				await this.connection.close();
				logger.info('RabbitMQ connection closed');
			} catch (err) {
				logger.error('Error closing RabbitMQ connection:', err);
			}
			this.connection = null;
		}

		this.connected = false;
	}
}
