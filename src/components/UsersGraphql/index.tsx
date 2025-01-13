import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { client } from '../../apolloClient';

const GET_USERS = gql`
	query users {
		getUsers {
			id
			firstName
			lastName
			age
		}
	}
`;

interface User {
	id: string;
	firstName: string;
	lastName: string;
	age: number;
}

export default function UsersGraphql() {
	const { loading, error, data } = useQuery(GET_USERS, { client });

	if (loading) return <p>Loading...</p>;
	if (error) {
		console.error(error);
		return <p>Error :(</p>;
	}

	return (
		<ul>
			{data?.getUsers?.map(({ id, firstName, lastName, age }: User) => (
				<li key={id}>
					{id}, {firstName} {lastName}, {age}
				</li>
			))}
		</ul>
	);
}
