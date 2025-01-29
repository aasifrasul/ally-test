import React, { useState, useEffect } from 'react';
import { subscribe } from '../../graphql/client';

interface User {
	id: string;
	firstName: string;
	lastName: string;
	age: number;
}

interface GraphqlData {
	users: User[];
}

export default function DisplayGraphql() {
	const [data, setData] = useState<GraphqlData | null>(null);

	useEffect(() => {
		subscribe('{ users {id, firstName, lastName, age} }')
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

		fetch('/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				query: `
				mutation CreateUser($firstName: String!, $lastName: String!, $age: Int!) {
					createUser(firstName: $firstName, lastName: $lastName, age: $age)
				}
				`,
				variables: {
					firstName: 'John',
					lastName: 'Doe',
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
