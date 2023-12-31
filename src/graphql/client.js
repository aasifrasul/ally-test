const { createClient } = require('graphql-http');

export const client = createClient({
	url: 'http://localhost:3100/graphql/',
	fetchFn: fetch,
	abortControllerImpl: AbortController, // node < v15
});
