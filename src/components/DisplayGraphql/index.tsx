import { useState, useEffect } from 'react';
import { subscribe } from '../../graphql/client';
import { BASE_URL } from '../../constants/base';

interface User {
	id: string;
	first_name: string;
	last_name: string;
	age: number;
}

interface GraphqlData {
	users: User[];
}

export default function DisplayGraphql() {
	const [data, setData] = useState<GraphqlData | null>(null);

	useEffect(() => {
		subscribe('{ users {id, first_name, last_name, age} }')
			.then((result) => {
				if (result?.data) {
					setData(result.data as GraphqlData);
				} else {
					console.error('Invalid subscription result:', result);
				}
			})
			.catch((error) => {
				console.error('Subscription error:', error);
			});

		fetch(`${BASE_URL}/graphql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				query: `mutation CreateUser($first_name: String!, $last_name: String!, $age: Int!) {
					createUser(first_name: $first_name, last_name: $last_name, age: $age)
				}`,
				variables: {
					first_name: 'John',
					last_name: 'Doe',
					age: 30,
				},
			}),
		})
			.then((response) => response.json())
			.then((data) => setData(data))
			.catch((error) => {
				console.error('Mutation error:', error);
			});
	}, []);

	return (
		<div>
			<span>{JSON.stringify(data)}</span>
		</div>
	);
}
