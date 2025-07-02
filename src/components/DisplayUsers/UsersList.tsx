import { Segment } from '../Common/Segment';

import { UserCard } from './UserCard';
import { User, EditUser, DeleteUser } from './types';

interface UsersListProps {
	users: User[];
	handleEditUser: EditUser;
	handleDeleteUser: DeleteUser;
}

export const UsersList = ({ users, handleEditUser, handleDeleteUser }: UsersListProps) => {
	return (
		<div>
			<Segment padded raised>
				<div>
					<h3 className="text-lg font-semibold text-gray-800 mb-4">
						All Users ({users.length})
					</h3>
					{users.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{users.map((user) => (
								<UserCard
									key={user.id}
									user={user}
									handleEditUser={handleEditUser}
									handleDeleteUser={handleDeleteUser}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
							<div className="text-4xl mb-4">📚</div>
							<p className="text-gray-400 text-sm">No Users</p>
						</div>
					)}
				</div>
			</Segment>
		</div>
	);
};
