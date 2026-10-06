import { BaseAIProvider } from './baseAIProvider';
import type { ChatPrompt, ChatResult } from './aiProvider';

export class OpenAIProvider extends BaseAIProvider {
	public readonly name = 'openai' as const;

	constructor(
		private readonly apiKey: string,
		private readonly baseUrl = 'https://api.openai.com/v1',
	) {
		super();
	}

	protected getCompletionUrl(): string {
		return `${this.baseUrl}/chat/completions`;
	}

	protected getHeaders(): HeadersInit {
		return {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${this.apiKey}`,
		};
	}

	protected buildRequestBody(prompt: ChatPrompt): Record<string, unknown> {
		return {
			model: prompt.model ?? 'gpt-4o-mini',
			messages: prompt.messages,
		};
	}

	protected parseResponse(data: any): ChatResult {
		return {
			content: data?.choices?.[0]?.message?.content ?? '',
			model: data?.model,
			usage: data?.usage,
			raw: data,
		};
	}

	async healthCheck(): Promise<boolean> {
		try {
			if (!this.apiKey) return false;

			const response = await fetch(`${this.baseUrl}/models`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${this.apiKey}`,
				},
			});

			return response.ok;
		} catch {
			return false;
		}
	}
}
