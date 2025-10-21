import { v4 as uuidv4 } from 'uuid';
import { SessionsClient, protos } from '@google-cloud/dialogflow';

import { logger } from '../../Logger';

// DialogFlow setup
const projectId: string = 'aasifrasul-wgxk'; // Replace with your DialogFlow project ID
const sessionId: string = uuidv4();
const languageCode: string = 'en-US';

const sessionClient: SessionsClient = new SessionsClient({
	keyFilename: 'server/src/utils/dialogFlow/index.ts', // Replace with the path to your service account key
});
logger.info(
	`DialogFlow client initialized with sessionClient: ${JSON.stringify(sessionClient)}`,
);
export async function runDialogFlow(text: string): Promise<string> {
	const sessionPath: string = sessionClient.projectAgentSessionPath(projectId, sessionId);
	logger.info(`sessionPath: ${JSON.stringify(sessionPath)}`);

	const request: protos.google.cloud.dialogflow.v2.IDetectIntentRequest = {
		session: sessionPath,
		queryInput: {
			text: {
				text: text,
				languageCode: languageCode,
			},
		},
	};

	try {
		const [response] = await sessionClient.detectIntent(request);
		const result = response.queryResult;
		return result?.fulfillmentText || 'No response from DialogFlow.';
	} catch (error) {
		console.error('DialogFlow error:', error);
		return 'Sorry, I encountered an error processing your request.';
	}
}
