import type { AIProvider, ChatPrompt, ChatResult } from './aiProvider';

export abstract class BaseAIProvider implements AIProvider {
	abstract readonly name: 'openai' | 'ollama';

	protected abstract getCompletionUrl(): string;
	protected abstract getHeaders(): HeadersInit;
	protected abstract buildRequestBody(prompt: ChatPrompt): Record<string, unknown>;
	protected abstract parseResponse(data: any): ChatResult;

	async complete(prompt: ChatPrompt): Promise<ChatResult> {
		const response = await fetch(this.getCompletionUrl(), {
			method: 'POST',
			headers: this.getHeaders(),
			body: JSON.stringify(this.buildRequestBody(prompt)),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`${this.name} request failed: ${response.status} ${errorText}`);
		}

		const data = await response.json();
		return this.parseResponse(data);
	}

	abstract healthCheck(): Promise<boolean>;
}
