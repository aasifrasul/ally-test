import React from 'react';

import { subscribe } from '../../graphql/client';

export default function DisplayGraphql() {
	const [data, setData] = React.useState('');

	React.useEffect(() => {
		subscribe('{ users {id, firstName, lastName, age} }').then((result) => {
			setData(result);
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
			.then((r) => r.json())
			.then((data) => setData(data));
	}, []);

	return (
		<div>
			<span>{JSON.stringify(data)}</span>
		</div>
	);
}
