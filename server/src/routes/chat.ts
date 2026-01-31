import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
	try {
		const reqId = (req as any).id || 'none';
		console.log(`[chat] request id=${reqId} body=${JSON.stringify(req.body)}`);

		const { message } = req.body;

		// Validate request payload
		if (!message || typeof message !== 'string') {
			res.status(400).json({ error: 'Missing or invalid `message` in request body' });
			return;
		}

		console.log(`[chat] request id=${reqId} - calling OpenAI API...`);

		// Use the Responses API which is the recommended unified API surface.
		const response = await fetch('http://localhost:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'llama3',
				messages: message,
				stream: false,
			}),
		});

		const data = await response.json();
		res.json(data.message);
	} catch (err: any) {
		const reqId = (req as any).id || 'none';
		console.error(`[chat] request id=${reqId} - error:`, {
			message: err?.message,
			status: err?.status,
			code: err?.code,
			type: err?.type,
		});

		// Distinguish between API key issues and other errors
		if (
			err?.status === 401 ||
			err?.code === 'invalid_api_key' ||
			err?.message?.includes('401')
		) {
			res.status(401).json({ error: 'Invalid or missing OpenAI API key' });
		} else {
			res.status(500).json({
				error: 'Chatbot error: ' + (err?.message || 'unknown error'),
			});
		}
	}
});

export { router as chatRoute };
