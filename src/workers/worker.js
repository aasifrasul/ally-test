const workerCode = () => {
	self.addEventListener(
		'message',
		(event) => {
			if (typeof event.data === 'string') {
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
};

let code = workerCode.toString();
code = code.substring(code.indexOf('{') + 1, code.lastIndexOf('}'));

const blob = new Blob([code], { type: 'application/javascript' });
const workerScript = URL.createObjectURL(blob);

export { workerScript };
