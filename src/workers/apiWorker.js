/* eslint-disable no-restricted-globals */
const isType = (data, type) => Object.prototype.toString.call(data).slice(8, -1).toLowerCase() === type;
const isString = (data) => isType(data, 'string');

self.addEventListener(
	'message',
	(event) => {
		if (isString(event.data)) {
			const { endpoint, options } = JSON.parse(event.data) || {};
			console.log('event.data', event.data);

			endpoint &&
				fetch(endpoint, options)
					.then((response) => response.json())
					.then((data) => {
						self.postMessage({ type: 'apiResponse', data });
					});
		}
	},
	false
);
