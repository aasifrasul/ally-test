const PubSub = (function () {
	const subscribers = new Map();

	const subscribe = (eventName, callback) => {
		if (typeof callback !== 'function' || typeof eventName !== 'string') {
			throw new Error('Invalid eventName or callback');
		}

		if (!subscribers.has(eventName)) {
			subscribers.set(eventName, new Set());
		}

		subscribers.get(eventName).add(callback);

		return {
			unsubscribe() {
				const subs = subscribers.get(eventName);
				if (subs) {
					subs.delete(callback);
					if (subs.size === 0) {
						subscribers.delete(eventName);
					}
				}
			},
		};
	};

	const publish = (eventName, data) => {
		if (typeof eventName !== 'string') {
			throw new Error('Invalid eventName');
		}

		const subs = subscribers.get(eventName);
		if (subs) {
			// Create array to avoid iterator invalidation
			Array.from(subs).forEach((cb) => {
				try {
					cb(data);
				} catch (err) {
					console.error(`Error in subscriber callback: ${err}`);
				}
			});
		}
	};

	const clear = () => {
		subscribers.clear();
	};

	return {
		subscribe,
		publish,
		clear,
	};
})();

const subscription = PubSub.subscribe('/page/load', function (obj) {
	console.log('subscribed to', obj);
	// Do something now that the event has occurred
});

const subscription2 = PubSub.subscribe('/page/load', function (obj) {
	console.log('subscribed2 to', obj);
	// Do something now that the event has occurred
});

const subscription3 = PubSub.subscribe('/page/load', function (obj) {
	console.log('subscribed3 to', obj);
	// Do something now that the event has occurred
});

PubSub.publish('/page/load', {
	url: '/some/url/path', // any argument
});

// ...sometime later where I no longer want subscription...
subscription.unsubscribe();
subscription2.unsubscribe();
subscription3.unsubscribe();
