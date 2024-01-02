const { createClient } = require('graphql-http');

export const client = createClient({
	url: 'http://localhost:3100/graphql/',
	fetchFn: fetch,
	abortControllerImpl: AbortController, // node < v15
});

export const subscribe = async (query) => {
	let cancel = () => {
		/* abort the request if it is in-flight */
	};

	const result = await new Promise((resolve, reject) => {
		let result;
		cancel = client.subscribe(
			{ query },
			{
				next: (data) => (result = data),
				error: reject,
				complete: () => resolve(result),
			},
		);
	});
	return result;
};

/**
 * query hello { "query": "{ hello }" }
 * query all users { "query": "{ user {id, name, age} }" }
 * query a single user { "query": "{ user(id: 1) {id, name, age} }" }
 */
