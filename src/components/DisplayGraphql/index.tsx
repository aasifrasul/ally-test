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
	const [data, setData] = useState<User[]>([]);

	useEffect(() => {
		fetch(`${BASE_URL}/graphql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				query: '{ getUsers {id, first_name, last_name, age} }'
			}),
		})
			.then(response => response.json())
			.then(result => {
				if (result?.data) {
					setData(result.data);
				}
			})
			.catch(error => console.error('Query error:', error));

		fetch(`${BASE_URL}/graphql`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: JSON.stringify({
				query: `mutation createUser($first_name: String!, $last_name: String!, $age: Int!) {
					createUser(first_name: $first_name, last_name: $last_name, age: $age)
					{ success message user { id first_name last_name age } }
				}`,
				variables: {
					first_name: 'John',
					last_name: 'Doe',
					age: 30,
				},
			}),
		})
			.then((response) => response.json())
			.then(({ user }) => {
				if (user) {
					setData((prev) => [...prev, user])
				}
			})
			.catch((error) => {
				console.error('Mutation error:', error);
			});

		const subscriptionPromise = subscribe('subscription { userCreated {id, first_name, last_name, age} }')
			.then((result) => {
				console.log('result', result);
				if (result?.data) {
					//setData(result.data);
				}
			})
			.catch((error) => console.error('Subscription error:', error));

		//return () => unsubscribe(); 
	}, []);

	return (
		<div>
			<span>{JSON.stringify(data)}</span>
		</div>
	);
}
