import { gql } from 'graphql-request';
import { useState, useEffect } from 'react';

// Assuming your GraphQL server supports subscriptions over WebSocket
const SUBSCRIPTION_URI = 'ws://127.0.0.1:3100/graphql';

const USER_CREATED_SUBSCRIPTION = gql`
	subscription UserCreated {
		userCreated {
			id
			name
			email
		}
	}
`;

export function useSubscription() {
	const [data, setData] = useState(null);
	const [error, setError] = useState<Event | null>(null);

	useEffect(() => {
		const ws = new WebSocket(SUBSCRIPTION_URI);

		ws.onopen = () => {
			console.log('WebSocket is open now.');
			const payload = {
				query: USER_CREATED_SUBSCRIPTION,
			};
			ws.send(
				JSON.stringify({
					type: 'subscribe',
					payload,
				}),
			);
		};

		ws.onmessage = (event) => {
			const { data } = JSON.parse(event.data);
			if (data?.type === 'data') {
				setData(data.payload.userCreated);
			}
		};

		ws.onerror = (err) => {
			console.error('WebSocket Error: ', err);
			setError(err);
		};

		return () => {
			ws.close();
		};
	}, []);

	return { data, error };
}
