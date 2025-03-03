import React from 'react';
import { useSubscription, gql } from '@apollo/client';

const USER_CREATED_SUBSCRIPTION = gql`
	subscription {
		userCreated {
			id
			first_name
			last_name
			age
		}
	}
`;

interface User {
	id: string;
	first_name: string;
	last_name: string;
	age: number;
}

function GraphqlSubscription(): React.ReactNode {
	const { error, data, loading } = useSubscription<{ userCreated: User }>(
		USER_CREATED_SUBSCRIPTION,
	);

	if (loading) return <p>Listening for new messages...</p>;
	if (error) {
		console.error(error);
		return <p>Error :(</p>;
	}

	return <p>New message: {JSON.stringify(data?.userCreated)}</p>;
}

export default GraphqlSubscription;
