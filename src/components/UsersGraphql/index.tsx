import { useQuery, gql } from '@apollo/client';
import { client } from '../../apolloClient';

const GET_USERS = gql`
	query users {
		getUsers {
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

export default function UsersGraphql() {
	const { loading, error, data } = useQuery(GET_USERS, { client });

	if (loading) return <p>Loading...</p>;
	if (error) {
		console.error(error);
		return <p>Error :(</p>;
	}

	return (
		<ul>
			{data?.getUsers?.map(({ id, first_name, last_name, age }: User) => (
				<li key={id}>
					{id}, {first_name} {last_name}, {age}
				</li>
			))}
		</ul>
	);
}
