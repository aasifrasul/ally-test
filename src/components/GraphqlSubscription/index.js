import React, { useEffect, useState } from 'react';
import { useSubscription, gql } from '@apollo/client';

const USER_CREATED_SUBSCRIPTION = gql`
	subscription {
		userCreated {
			id
			firstName
			lastName
			age
		}
	}
`;

function GraphqlSubscription() {
	const { data, loading } = useSubscription(USER_CREATED_SUBSCRIPTION);

	if (loading) return <p>Listening for new messages...</p>;

	return <p>New message: {JSON.stringify(data.userCreated)}</p>;
}

export default GraphqlSubscription;
