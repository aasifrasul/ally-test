const fetch = require('node-fetch');
const { AbortController } = require('node-abort-controller');
const { createClient } = require('graphql-http');

const client = createClient({
	url: 'http://localhost:3100/graphql/',
	fetchFn: fetch,
	abortControllerImpl: AbortController, // node < v15
});
