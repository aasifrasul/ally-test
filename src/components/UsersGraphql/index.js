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

export default function UsersGraphql() {
	const { loading, error, data } = useQuery(GET_USERS, { client });

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error :( {console.error(error)}</p>;

	return (
		<ul>
			{data?.getUsers?.map(({ id, firstName, lastName, age }, index) => (
				<li key={id}>
					{index + 1}, {firstName} {lastName}, {age}
				</li>
			))}
		</ul>
	);
}
