import React, { useEffect, useState } from 'react';
import { useSubscription, gql } from '@apollo/client';

const USER_CREATED_SUBSCRIPTION = gql`
	subscription UserCreated {
		userCreated {
			id
			name
			email
		}
	}
`;

function GraphqlSubscription() {
	const [data, setData] = useState(null);

	useEffect(() => {
		const unsubscribe = useSubscription(USER_CREATED_SUBSCRIPTION).subscribe({
			next: ({ data }) => setData(data),
			error: (err) => console.error(err),
			complete: () => console.log('Done!'),
		});

		// Cleanup subscription on unmount
		return () => unsubscribe();
	}, []);

	return <div>Listening for user creation... {data}</div>;
}

export default GraphqlSubscription;
