import { useState } from 'react';
import { subscribeWithCallback, executeQuery } from '../../graphql/client';

import useEffectOnce from '../../hooks/useEffectOnce';

import { UserForm } from './UserForm';
import { UsersList } from './UsersList';
import { createLogger, LogLevel, Logger } from '../../utils/logger';

import { User, AddUser, UpdateUser, EditUser, DeleteUser } from './types';

const logger: Logger = createLogger('DisplayUsers', {
	level: LogLevel.DEBUG,
});

export default function DisplayUsers() {
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [users, setUsers] = useState<User[]>([]);
	const [editingUser, setEditingUser] = useState<User | null>(null);

	useEffectOnce(() => {
		let unsubscribe: (() => void) | null = null;

		const loadInitialData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load initial users
				const result = await executeQuery<{ getUsers: User[] }>(`
					{ getUsers { id, first_name, last_name, age } }
				`);

				setUsers(result.getUsers);

				// Set up subscription for real-time updates
				unsubscribe = subscribeWithCallback<{ userCreated: User }>(
					'subscription { userCreated { id, first_name, last_name, age } }',
					{
						onData: (subscriptionData) => {
							logger.info('New user created:', subscriptionData.userCreated);
							setUsers((prev) => [...prev, subscriptionData.userCreated]);
						},
						onError: (error) => {
							logger.error('Subscription error:', error);
						},
					},
				);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : 'Something went wrong';
				setError(errorMessage);
				logger.error('Error loading users:', err);
			} finally {
				setIsLoading(false);
			}
		};

		loadInitialData();

		// Cleanup subscription on unmount
		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	});

	const addUser: AddUser = async (firstName, lastName, age) => {
		const { createUser } = await executeQuery(
			`mutation createUser($first_name: String!, $last_name: String!, $age: Int!) {
				createUser(first_name: $first_name, last_name: $last_name, age: $age) {
					success 
					message 
					user { id first_name last_name age }
				}
			}`,
			{
				first_name: firstName,
				last_name: lastName,
				age: age,
			},
		);

		const { success, user } = createUser;

		if (success) {
			setUsers((prevData) => [...prevData, user]);
		}
	};

	const updateUser: UpdateUser = async (id, firstName, lastName, age) => {
		const { updateUser } = await executeQuery(
			`mutation updateUser($id: ID!, $first_name: String!, $last_name: String!, $age: Int!) { 
				updateUser(id: $id, first_name: $first_name, last_name: $last_name, age: $age) { 
					success 
					message 
					user { id first_name last_name age } 
				} 
			}`,
			{
				id,
				first_name: firstName,
				last_name: lastName,
				age,
			},
		);

		const { success, user } = updateUser;

		if (success) {
			setUsers((prevData) => prevData.map(item => item.id === user.id ? user : item));
			setEditingUser(null);
		}
	};

	const handleDeleteUser: DeleteUser = async (id) => {
		const { deleteUser } = await executeQuery(
			`mutation deleteUser($id: ID!) { 
				deleteUser(id: $id) { 
					success 
					message 
					id 
				} 
			}`,
			{
				id,
			},
		);

		if (deleteUser.success) {
			setUsers((prevData) => prevData.filter(item => item.id !== deleteUser.id));
		}
	}

	const handleEditUser: EditUser = (id) => {
		const user: User | undefined = users.find(user => user.id === id);
		user && setEditingUser(user);
	}

	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error: {error}</div>;
	}

	return (
		<div>
			<UserForm editingUser={editingUser} addUser={addUser} updateUser={updateUser} />
			<UsersList users={users} handleEditUser={handleEditUser} handleDeleteUser={handleDeleteUser} />
		</div>
	);
}
