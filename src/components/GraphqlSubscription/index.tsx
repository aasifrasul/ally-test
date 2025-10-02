import { useState } from 'react';
import { subscribeWithCallback } from '../../graphql/client';

interface UseSubscriptionResult<T> {
	data: T | null;
	isLoading: boolean;
	error: Error | null;
}

const USER_CREATED_SUBSCRIPTION = `
  subscription {
	userCreated {
	  id
	  name
	  email
	}
  }
`;

export default function GraphqlSubscription() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);

	subscribeWithCallback(USER_CREATED_SUBSCRIPTION, {
		onData: (data) => {
			console.log('New user:', data);
			setIsLoading(false);
			setData(data);
		},
		onError: (error) => {
			console.log('Error:', error);
			setIsLoading(false);
			setError(error);
		},
	});

	return (
		<div>
			{isLoading && <div>Listening for new users...</div>}
			{error && <div>Subscription error: {JSON.stringify(error)}</div>}
			{data && <div>New user created: {JSON.stringify(data)}</div>}
		</div>
	);
}
