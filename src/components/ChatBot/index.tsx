import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';

type Message = {
	text: string;
	sender: 'user' | 'bot';
};

const ChatBot: React.FC = () => {
	const [messages, setMessages] = useState<Message[]>([
		{ text: 'How Can I help you?', sender: 'bot' },
	]);
	const [input, setInput] = useState<string>('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(scrollToBottom, [messages]);

	const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (input.trim() === '') return;

		const newMessage: Message = { text: input, sender: 'user' };
		setMessages((prevMessages) => [...prevMessages, newMessage]);
		setInput('');

		fetch('/api/chat', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ message: input }),
		})
			.then((response) => {
				// Check if the response is OK
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				// Parse the response as JSON
				return response.json();
			})
			.then((data) => {
				// Handle the parsed data
				setMessages((prevMessages) => [
					...prevMessages,
					{ text: data.message, sender: 'bot' },
				]);
			})
			.catch((error) =>
				console.error('There was a problem with the fetch operation:', error),
			);
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
								sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
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
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						className="flex-1 border rounded-l-lg p-2"
						placeholder="Type a message..."
					/>
					<button type="submit" className="bg-blue-500 text-white p-2 rounded-r-lg">
						<Send size={24} />
					</button>
				</div>
			</form>
		</div>
	);
};

export default ChatBot;
