export function fetchProfileData() {
	let userPromise = fetchUser();
	let postsPromise = fetchPosts();
	return {
		user: wrapPromise(userPromise),
		posts: wrapPromise(postsPromise),
	};
}

// Suspense integrations like Relay implement
// a contract like this to integrate with React.
// Real implementations can be significantly more complex.
// Don't copy-paste this into your project!
function wrapPromise(promise) {
	let status = 'pending';
	let result;
	let suspender = promise.then(
		(r) => {
			status = 'success';
			result = r;
		},
		(e) => {
			status = 'error';
			result = e;
		},
	);
	return {
		read() {
			if (status === 'pending') {
				throw suspender;
			} else if (status === 'error') {
				throw result;
			} else if (status === 'success') {
				return result;
			}
		},
	};
}

export function fetchUser() {
	console.log('fetch user...');
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('fetched user');
			resolve({
				name: 'Ringo Starr',
			});
		}, 1000);
	});
}

export function fetchPosts() {
	console.log('fetch posts...');
	return new Promise((resolve) => {
		setTimeout(() => {
			console.log('fetched posts');
			resolve([
				{
					id: 0,
					text: 'I get by with a little help from my friends',
				},
				{
					id: 1,
					text: "I'd like to be under the sea in an octupus's garden",
				},
				{
					id: 2,
					text: 'You got that sand all over your feet',
				},
			]);
		}, 2000);
	});
}
