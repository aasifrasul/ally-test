import { createClient, NetworkError } from 'graphql-http';

const client = createClient({
	url: 'http://localhost:3100/graphql/',
	shouldRetry: async (err, retries) => {
		if (retries > 3) {
			// max 3 retries and then report service down
			return false;
		}

		// try again when service unavailable, could be temporary
		if (err.response?.status === 503) {
			// wait one second (you can alternatively time the promise resolution to your preference)
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return true;
		}

		// otherwise report error immediately
		return false;
	},
});
