import { BaseAIProvider } from './baseAIProvider';
import type { ChatPrompt, ChatResult } from './aiProvider';

export class OllamaProvider extends BaseAIProvider {
	public readonly name = 'ollama' as const;

	constructor(
		private readonly baseUrl: string = 'http://localhost:11434',
		private readonly defaultModel: string = 'llama3',
	) {
		super();
	}

	protected getCompletionUrl(): string {
		return `${this.baseUrl}/api/chat`;
	}

	protected getHeaders(): HeadersInit {
		return {
			'Content-Type': 'application/json',
		};
	}

	protected buildRequestBody(prompt: ChatPrompt): Record<string, unknown> {
		return {
			model: prompt.model ?? this.defaultModel,
			messages: prompt.messages,
			stream: false,
		};
	}

	protected parseResponse(data: any): ChatResult {
		return {
			content: data?.message?.content ?? '',
			model: data?.model,
			raw: data,
		};
	}

	async healthCheck(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`, {
				method: 'GET',
			});

			return response.ok;
		} catch {
			return false;
		}
	}
}
