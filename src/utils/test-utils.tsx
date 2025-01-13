(async function () {
	const wait = (duration: number) => {
		return new Promise((resolve) => {
			setTimeout(resolve, duration);
		});
	};

	const getUser = async (id: number) => {
		await wait(1000);

		if (id === 2) {
			throw new Error('404 - User does not exist');
		}

		return { id, name: 'Noah' };
	};

	const handleAsyncCalls = async <T,>(
		promise: Promise<T>,
	): Promise<[undefined, T] | [Error]> => {
		return promise
			.then((data) => {
				return [undefined, data] as [undefined, T];
			})
			.catch((error) => {
				return [error];
			});
	};

	const [error, user] = await handleAsyncCalls(getUser(1));

	if (error) {
		console.log(error);
	}

	console.log(user);
})();
