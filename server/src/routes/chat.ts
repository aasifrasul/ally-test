import express, { Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { OllamaProvider } from '../providers/ollamaProvider';

const router = express.Router();
const provider = new OllamaProvider(process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434');
const chatService = new ChatService(provider);

router.post('/', async (req: Request, res: Response): Promise<void> => {
	try {
		const reqId = (req as any).id || 'none';
		const { message } = req.body;

		if (typeof message !== 'string' || !message.trim()) {
			res.status(400).json({ error: 'Missing or invalid `message` in request body' });
			return;
		}

		const result = await chatService.sendMessage({
			message,
			context: {
				requestId: reqId,
			},
		});

		res.json({
			success: true,
			data: result,
		});
	} catch (err: any) {
		const reqId = (req as any).id || 'none';
		console.error(`[chat] request id=${reqId} - error:`, {
			message: err?.message,
			status: err?.status,
			code: err?.code,
			type: err?.type,
		});

		res.status(500).json({
			success: false,
			error: err?.message || 'Chatbot error',
		});
	}
});

export { router as chatRoute };
