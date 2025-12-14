import express, { Request, Response } from 'express';
import OpenAI from 'openai';

import { OPENAI_API_KEY } from '../envConfigDetails';

const router = express.Router();

// Validate API key on startup
if (!OPENAI_API_KEY) {
	console.warn('[chat] WARNING: OPENAI_API_KEY is not set in environment variables');
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY || '' });

// Local types for the Responses API output shape we care about.
type OutputContent = { type?: string; text?: string } | string;
type OutputItem = { id?: string; type?: string; content?: OutputContent[] };
type ResponsesAPIResponse = { output?: OutputItem[] };

router.post('/', async (req: Request, res: Response): Promise<void> => {
	try {
		const reqId = (req as any).id || 'none';
		console.log(`[chat] request id=${reqId} body=${JSON.stringify(req.body)}`);

		// Check API key
		if (!OPENAI_API_KEY) {
			console.error(`[chat] request id=${reqId} - API key not configured`);
			res.status(500).json({
				error: 'Chatbot service not configured (missing API key)',
			});
			return;
		}

		const { message } = req.body;

		// Validate request payload
		if (!message || typeof message !== 'string') {
			res.status(400).json({ error: 'Missing or invalid `message` in request body' });
			return;
		}

		console.log(`[chat] request id=${reqId} - calling OpenAI API...`);

		// Use the Responses API which is the recommended unified API surface.
		const response = (await client.responses.create({
			model: 'gpt-4o-mini',
			input: message,
		})) as ResponsesAPIResponse;

		console.log(`[chat] request id=${reqId} - OpenAI response received`);

		// Safely extract text content: Responses API uses an `output` array
		// whose items contain a `content` array. Content entries can be
		// strings or objects with a `text` field.
		let reply = '';
		const output = response.output ?? [];
		if (output.length > 0) {
			const first = output[0];
			const contents = first.content ?? [];
			reply = contents
				.map((c) => (typeof c === 'string' ? c : (c?.text ?? '')))
				.filter(Boolean)
				.join(' ');
		}

		console.log(
			`[chat] request id=${reqId} - sending reply: ${reply.substring(0, 50)}...`,
		);
		res.json({ reply });
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
