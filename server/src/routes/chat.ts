import express, { Request, Response } from 'express';
import OpenAI from 'openai';

import { OPENAI_API_KEY } from '../envConfigDetails';

const router = express.Router();
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

router.post('/', async (req: Request, res: Response): Promise<void> => {
	try {
		const { message } = req.body;

		const completion = await client.chat.completions.create({
			model: 'gpt-4.1-mini',
			messages: [{ role: 'user', content: message }],
		});

		res.json({
			reply: completion.choices[0].message.content,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Chatbot error' });
	}
});

export { router as chatRoute };
