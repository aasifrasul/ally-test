import React, { useState, useEffect, useRef } from 'react';
import { InputText } from '../Common/InputText';
import { fetchAPIData, Result } from '../../utils/AsyncUtil';
import Button from '../Common/Button';

// Custom Send Icon Component
const SendIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="22" y1="2" x2="11" y2="13"></line>
		<polygon points="22,2 15,22 11,13 2,9"></polygon>
	</svg>
);

type Message = {
	text: string;
	sender: 'user' | 'bot';
};

const ChatBot: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([
		{ text: 'How Can I help you?', sender: 'bot' },
	]);
	const [isLoading, setIsLoading] = useState(false);

	const chatTextRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(scrollToBottom, [messages]);

	const getErrorMessage = (error: any): string => {
		const errorMsg = error?.message || String(error) || 'Unknown error';

		// Handle 429 quota exceeded errors
		if (
			errorMsg.includes('429') ||
			errorMsg.includes('quota') ||
			errorMsg.includes('exceeded')
		) {
			return 'API quota exceeded. Please check your OpenAI plan and billing details. Try again later.';
		}
		// Handle 401 authentication errors
		if (errorMsg.includes('401') || errorMsg.includes('API key')) {
			return 'Authentication failed. Please check your API key configuration.';
		}
		// Handle 503 service unavailable
		if (errorMsg.includes('503')) {
			return 'API service temporarily unavailable. Please try again later.';
		}
		return `Error: ${errorMsg.substring(0, 100)}`;
	};

	const sendMessage = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		const cleanedText = chatTextRef.current?.value?.trim() || '';
		if (cleanedText === '' || isLoading) return;

		const newMessage: Message = { text: cleanedText, sender: 'user' };
		setMessages((prevMessages) => [...prevMessages, newMessage]);

		// Clear input field
		chatTextRef.current?.clear();

		setIsLoading(true);

		const response: Result<any> = await fetchAPIData(`/api/chat`, {
			body: JSON.stringify({ message: cleanedText }),
		});

		setIsLoading(false);

		if (!response.success) {
			const errorMessage = getErrorMessage(response.error);
			console.error('ChatBot error:', response.error);
			setMessages((prevMessages) => [
				...prevMessages,
				{ text: errorMessage, sender: 'bot' },
			]);
			return;
		}

		setMessages((prevMessages) => [
			...prevMessages,
			{
				text: response.data?.message || response.data?.reply || 'No response received',
				sender: 'bot',
			},
		]);
	};

	return (
		<div className="flex flex-col h-screen max-w-md mx-auto">
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map(({ text, sender }, index) => (
					<div
						key={index}
						className={`flex ${
							sender === 'user' ? 'justify-end' : 'justify-start'
						}`}
					>
						<div
							className={`rounded-lg p-2 max-w-xs ${
								sender === 'user'
									? 'bg-blue-500 text-white'
									: text.toLowerCase().includes('error')
										? 'bg-red-100 text-red-800'
										: 'bg-gray-200'
							}`}
						>
							<b>{sender}</b>: {text}
						</div>
					</div>
				))}
				<div ref={messagesEndRef} />
			</div>
			<form onSubmit={sendMessage} className="p-4 border-t">
				<div className="flex items-center">
					<InputText
						name="chatText"
						ref={chatTextRef}
						initialValue={''}
						className="flex-1 border rounded-l-lg p-2"
						placeholder="Type a message..."
						disabled={isLoading}
					/>
					<Button icon primary={true} size="small" disabled={isLoading}>
						<SendIcon size={24} />
					</Button>
				</div>
			</form>
		</div>
	);
};

export default ChatBot;
