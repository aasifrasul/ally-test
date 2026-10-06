export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
	role: ChatRole;
	content: string;
}

export interface ChatPrompt {
	messages: ChatMessage[];
	model?: string;
	metadata?: Record<string, unknown>;
}

export interface ChatResult {
	content: string;
	model?: string;
	usage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
	raw?: Record<string, unknown>;
}

export interface AIProvider {
	name: 'openai' | 'ollama';
	complete(prompt: ChatPrompt): Promise<ChatResult>;
	healthCheck(): Promise<boolean>;
}
