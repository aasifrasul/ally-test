import { PromiseFactory } from '.';

async function runExample() {
	const factory = new PromiseFactory<string>({
		autoCleanup: true,
		cleanupDelay: 30000,
		enableLogging: true,
	});

	try {
		// Create a promise with timeout
		const deferredUserData = factory.create('userData', 5000);
		console.log('Is userData pending?', deferredUserData.isPending); // true

		// Create another promise
		const deferredConfig = factory.create('config');

		// Resolve 'userData' after some time
		setTimeout(() => {
			factory.resolve('userData', 'User data loaded successfully!');
		}, 2000);

		// Reject 'config' after some time
		setTimeout(() => {
			factory.reject('config', new Error('Failed to load config!'));
		}, 1000);

		// Wait for multiple promises
		console.log('\nWaiting for userData and config...');
		try {
			const results = await factory.waitForAll(['userData', 'config'], 10000);
			console.log('waitForAll results:', results); // This might not be reached if config rejects
		} catch (error: any) {
			console.error('Error waiting for promises:', error.message);
		}

		// Get statistics
		console.log('\nFactory Stats:', factory.getStats());

		// Demonstrate getting or creating
		const existingOrNew = factory.getOrCreate('anotherPromise');
		console.log('Is anotherPromise pending?', existingOrNew.isPending);

		// Resolve 'anotherPromise'
		factory.resolve('anotherPromise', 'This was dynamically created or retrieved!');

		// Wait for auto-cleanup to potentially run (adjust cleanupDelay for quicker testing)
		console.log('\nWaiting for cleanup...');
		await new Promise((resolve) => setTimeout(resolve, 2000));
		console.log('Factory Stats after cleanup delay:', factory.getStats());
	} catch (error: any) {
		console.error('An error occurred:', error.message);
	} finally {
		factory.dispose();
		console.log('Factory disposed. Final Stats:', factory.getStats());
	}
}

runExample();
