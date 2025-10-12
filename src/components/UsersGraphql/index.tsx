import { useQuery, gql } from '@apollo/client';
import { client } from '../../ApolloClient';

const GET_USERS = gql`
	query users {
		getUsers {
			id
			name
			email
			age
		}
	}
`;

interface User {
	id: string;
	name: string;
	email: string;
	age?: number;
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
			{data?.getUsers?.map(({ id, name, email, age }: User) => (
				<li key={id}>
					{id}, {name} {email}, {age}
				</li>
			))}
		</ul>
	);
}
