import { useState, useEffect } from 'react';
import { subscribeWithCallback, executeQuery } from '../../graphql/client';
import { createLogger, LogLevel, Logger } from '../../utils/logger';

interface User {
	id: string;
	first_name: string;
	last_name: string;
	age: number;
}

const logger: Logger = createLogger('DisplayGraphql', {
	level: LogLevel.DEBUG,
});

export default function DisplayGraphql() {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<User[]>([]);

	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const loadInitialData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load initial users
				const result = await executeQuery<{ getUsers: User[] }>(`
					{ getUsers { id, first_name, last_name, age } }
				`);

				setData(result.getUsers);

				// Create a test user
				await executeQuery(
					`
					mutation createUser($first_name: String!, $last_name: String!, $age: Int!) {
						createUser(first_name: $first_name, last_name: $last_name, age: $age) {
							success 
							message 
							user { id first_name last_name age }
						}
					}
				`,
					{
						first_name: 'Aasif',
						last_name: 'Rasul',
						age: 40,
					},
				);

				// Set up subscription for real-time updates
				unsubscribe = subscribeWithCallback<{ userCreated: User }>(
					'subscription { userCreated { id, first_name, last_name, age } }',
					{
						onData: (subscriptionData) => {
							logger.info('New user created:', subscriptionData.userCreated);
							setData((prev) => [...prev, subscriptionData.userCreated]);
						},
						onError: (error) => {
							logger.error('Subscription error:', error);
						},
					},
				);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Something went wrong';
				setError(errorMessage);
				logger.error('Error loading data:', err);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();

		// Cleanup subscription on unmount
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, []);

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div>
			<h2>Users ({data.length})</h2>
			{data.length > 0 ? (
				<ul>
					{data.map(({ id, first_name, last_name, age }: User) => (
						<li key={id}>
							{id}, {first_name} {last_name}, {age}
						</li>
					))}
				</ul>
			) : (
				<span>No Records found.</span>
			)}
		</div>
	);
}
