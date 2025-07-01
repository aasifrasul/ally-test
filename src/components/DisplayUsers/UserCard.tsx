import Button from '../Common/Button';

import { User, EditUser, DeleteUser } from './types';

interface UserCardProps {
    user: User;
    handleEditUser: EditUser;
    handleDeleteUser: DeleteUser;
}

export const UserCard = ({ user, handleEditUser, handleDeleteUser }: UserCardProps) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                        {user.first_name}
                    </h4>
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                        {user.last_name}
                    </h4>
                    <p className="text-gray-600 mb-2">by {user.age}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    secondary
                    onClick={() => handleEditUser(user.id!)}
                    className="px-3 py-2 rounded-md transition-colors duration-200"
                    title="Edit"
                >
                    ✏️
                </Button>
                <Button
                    primary
                    negative
                    onClick={() => handleDeleteUser(user.id!)}
                    className="px-3 py-2 rounded-md transition-colors duration-200"
                    title="Delete"
                >
                    🗑️
                </Button>
            </div>
        </div>
    );
};
