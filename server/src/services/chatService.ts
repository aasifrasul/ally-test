import type { AIProvider, ChatPrompt, ChatResult } from '../providers/aiProvider';

export interface ChatServiceRequest {
	message: string;
	model?: string;
	context?: Record<string, unknown>;
}

export class ChatService {
	constructor(private readonly provider: AIProvider) {}

	async sendMessage(input: ChatServiceRequest): Promise<ChatResult> {
		if (!input?.message || typeof input.message !== 'string' || !input.message.trim()) {
			throw new Error('Message is required');
		}

		const prompt: ChatPrompt = {
			model: input.model,
			messages: [
				{
					role: 'user',
					content: input.message,
				},
			],
			metadata: input.context ?? {},
		};

		return this.provider.complete(prompt);
	}
}
