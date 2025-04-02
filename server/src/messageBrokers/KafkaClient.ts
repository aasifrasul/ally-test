import { Kafka, Producer, Consumer, Admin, KafkaMessage, logLevel } from 'kafkajs';
import { constants } from '../constants';
import { logger } from '../Logger';

const { clientId, brokers, MAX_RETRIES, RETRY_DELAY } = constants.messagingLayer.kafkaConfig;

export class KafkaClient {
	private static instance: KafkaClient;
	private kafka: Kafka;
	private producer: Producer | null = null;
	private consumers: Map<string, Consumer> = new Map();
	private admin: Admin | null = null;
	private producerConnected: boolean = false;
	private reconnectTimeout: NodeJS.Timeout | null = null;
	private initializing: boolean = false;
	private reconnectAttempts: number = 0;

	private constructor() {
		this.kafka = new Kafka({
			clientId: clientId || 'default-client',
			brokers: brokers || ['localhost:9092'],
			logLevel: logLevel.ERROR,
			retry: {
				initialRetryTime: 300,
				retries: 10,
			},
		});
	}

	public static getInstance(): KafkaClient {
		if (!KafkaClient.instance) {
			KafkaClient.instance = new KafkaClient();
		}
		return KafkaClient.instance;
	}

	public async connectProducer(): Promise<void> {
		if (this.producerConnected || this.initializing) {
			return; // Already connected or initializing
		}

		this.initializing = true;
		try {
			await this.connectProducerWithRetry();
		} finally {
			this.initializing = false;
		}
	}

	private async connectProducerWithRetry(): Promise<void> {
		try {
			this.producer = this.kafka.producer({
				allowAutoTopicCreation: true,
				retry: {
					initialRetryTime: RETRY_DELAY,
					retries: MAX_RETRIES,
				},
			});

			this.producer.on('producer.connect', () => {
				logger.info('Kafka producer connected');
				this.producerConnected = true;
				this.reconnectAttempts = 0;
			});

			this.producer.on('producer.disconnect', () => {
				logger.info('Kafka producer disconnected');
				this.producerConnected = false;
				this.scheduleReconnect();
			});

			this.producer.on('producer.network.request_timeout', (payload) => {
				logger.error('Kafka producer request timeout:', payload);
			});

			await this.producer.connect();
			this.producerConnected = true;
			logger.info('Kafka producer connected successfully');
		} catch (err) {
			logger.error('Failed to connect Kafka producer:', err);
			this.producerConnected = false;
			this.scheduleReconnect();
		}
	}

	private scheduleReconnect(): void {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}

		const maxReconnectAttempts = MAX_RETRIES ?? 5;

		if (this.reconnectAttempts >= maxReconnectAttempts) {
			logger.error(`Kafka connection failed after ${maxReconnectAttempts} attempts`);
			return;
		}

		const delay = Math.min(
			Math.pow(2, this.reconnectAttempts) * (RETRY_DELAY ?? 1000),
			30000,
		);
		logger.info(
			`Kafka reconnect scheduled in ${delay}ms, attempt: ${this.reconnectAttempts + 1}/${maxReconnectAttempts}`,
		);

		this.reconnectTimeout = setTimeout(() => {
			this.reconnectAttempts++;
			this.connectProducerWithRetry();
		}, delay);
	}

	public isProducerReady(): boolean {
		return this.producerConnected && this.producer !== null;
	}

	public async sendMessage(
		topic: string,
		message: string | Buffer | null,
		key?: string,
		headers?: Record<string, string>,
	): Promise<boolean> {
		if (!this.isProducerReady()) {
			await this.connectProducer();
			if (!this.isProducerReady()) {
				logger.error('Cannot send message: Kafka producer not ready');
				return false;
			}
		}

		try {
			const result = await this.producer!.send({
				topic,
				messages: [
					{
						key: key,
						value: message,
						headers: headers,
					},
				],
			});

			logger.debug(`Message sent to topic: ${topic}`, result);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to send message to topic ${topic}: ${errorMessage}`);
			return false;
		}
	}

	public async createConsumer(groupId: string): Promise<Consumer> {
		const existingConsumer = this.consumers.get(groupId);
		if (existingConsumer) {
			return existingConsumer;
		}

		const consumer = this.kafka.consumer({
			groupId,
			retry: {
				initialRetryTime: 300,
				retries: 10,
			},
		});

		consumer.on('consumer.crash', (event) => {
			logger.error(`Consumer in group ${groupId} crashed:`, event);
		});

		consumer.on('consumer.disconnect', () => {
			logger.info(`Consumer in group ${groupId} disconnected`);
		});

		consumer.on('consumer.connect', () => {
			logger.info(`Consumer in group ${groupId} connected`);
		});

		this.consumers.set(groupId, consumer);
		return consumer;
	}

	public async subscribeToTopic(
		groupId: string,
		topic: string,
		fromBeginning: boolean = false,
		eachMessageHandler: (message: KafkaMessage) => Promise<void>,
	): Promise<boolean> {
		try {
			const consumer = await this.createConsumer(groupId);
			await consumer.connect();

			await consumer.subscribe({
				topic,
				fromBeginning,
			});

			await consumer.run({
				eachMessage: async ({ topic, partition, message }) => {
					try {
						await eachMessageHandler(message);
					} catch (err) {
						logger.error(`Error processing message from topic ${topic}:`, err);
					}
				},
			});

			logger.info(`Subscribed to topic: ${topic} with consumer group: ${groupId}`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to subscribe to topic ${topic}: ${errorMessage}`);
			return false;
		}
	}

	public async disconnectConsumer(groupId: string): Promise<boolean> {
		const consumer = this.consumers.get(groupId);
		if (!consumer) {
			logger.warn(`No consumer found for group ${groupId}`);
			return false;
		}

		try {
			await consumer.disconnect();
			this.consumers.delete(groupId);
			logger.info(`Consumer in group ${groupId} disconnected`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to disconnect consumer in group ${groupId}: ${errorMessage}`);
			return false;
		}
	}

	public async disconnectProducer(): Promise<void> {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
		}

		if (this.producer && this.producerConnected) {
			try {
				await this.producer.disconnect();
				logger.info('Kafka producer disconnected');
			} catch (err) {
				logger.error('Error disconnecting Kafka producer:', err);
			}
			this.producerConnected = false;
		}
	}

	public async connectAdmin(): Promise<boolean> {
		if (!this.admin) {
			this.admin = this.kafka.admin();
		}

		try {
			await this.admin.connect();
			logger.info('Kafka admin connected');
			return true;
		} catch (err) {
			logger.error('Failed to connect Kafka admin:', err);
			return false;
		}
	}

	public async createTopic(topic: string, numPartitions: number = 1): Promise<boolean> {
		if (!this.admin) {
			const connected = await this.connectAdmin();
			if (!connected) {
				return false;
			}
		}

		try {
			await this.admin!.createTopics({
				topics: [
					{
						topic,
						numPartitions,
						replicationFactor: 1,
					},
				],
			});
			logger.info(`Topic ${topic} created successfully`);
			return true;
		} catch (err: unknown) {
			const errorMessage =
				err instanceof Error ? err.message : 'An unknown error occurred';
			logger.error(`Failed to create topic ${topic}: ${errorMessage}`);
			return false;
		}
	}

	public async listTopics(): Promise<string[]> {
		if (!this.admin) {
			const connected = await this.connectAdmin();
			if (!connected) {
				return [];
			}
		}

		try {
			const topics = await this.admin!.listTopics();
			return topics;
		} catch (err) {
			logger.error('Failed to list topics:', err);
			return [];
		}
	}

	public async disconnectAdmin(): Promise<void> {
		if (!this.admin) {
			return;
		}

		try {
			await this.admin.disconnect();
			logger.info('Kafka admin disconnected');
		} catch (err) {
			logger.error('Error disconnecting Kafka admin:', err);
		}
		this.admin = null;
	}

	public async disconnectAll(): Promise<void> {
		// Disconnect all consumers
		const consumerGroups = Array.from(this.consumers.keys());
		for (const groupId of consumerGroups) {
			await this.disconnectConsumer(groupId);
		}

		// Disconnect producer
		await this.disconnectProducer();

		// Disconnect admin
		await this.disconnectAdmin();

		logger.info('All Kafka connections closed');
	}
}
