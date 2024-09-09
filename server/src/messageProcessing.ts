// Simple in-memory storage for demonstration purposes
let todos: string[] = [];

function processMessage(message: string): string {
	const lowerCaseMessage = message.toLowerCase();

	if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
		return 'Hello! How can I assist you today?';
	} else if (lowerCaseMessage.includes('how are you')) {
		return "I'm just a computer program, but I'm functioning well. How can I help you?";
	} else if (lowerCaseMessage.includes('weather')) {
		return "I'm sorry, I don't have access to real-time weather data. You might want to check a weather website or app for accurate information.";
	} else if (lowerCaseMessage.includes('time')) {
		return `The current time is ${new Date().toLocaleTimeString()}.`;
	} else if (lowerCaseMessage.startsWith('add todo:')) {
		const todo = message.slice(9).trim();
		todos.push(todo);
		return `Added "${todo}" to your todo list.`;
	} else if (lowerCaseMessage === 'list todos') {
		return todos.length > 0
			? `Here are your todos:\n${todos.join('\n')}`
			: 'Your todo list is empty.';
	} else if (lowerCaseMessage.startsWith('remove todo:')) {
		const todoToRemove = message.slice(12).trim();
		const index = todos.indexOf(todoToRemove);
		if (index > -1) {
			todos.splice(index, 1);
			return `Removed "${todoToRemove}" from your todo list.`;
		} else {
			return `Couldn't find "${todoToRemove}" in your todo list.`;
		}
	} else {
		return "I'm not sure how to respond to that. Can you try rephrasing or asking something else?";
	}
}

export { processMessage };
