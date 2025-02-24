import React from 'react';
import Image from '../Common/Image';

interface UserCardProps {
	data: {
		picture?: {
			medium?: string;
		};
		name?: {
			first?: string;
			last?: string;
		};
		location?: {
			city?: string;
			country?: string;
		};
		email?: string;
	};
}

const UserCard: React.FC<UserCardProps> = ({ data }) => {
	const { name, location, email, picture } = data;
	const { first, last } = name || {};
	const { city, country } = location || {};
	const { medium } = picture || {};

	return (
		<div className="p-4 border border-gray-500 rounded bg-white flex items-center">
			{medium ? (
				<div>
					<Image
						src={medium}
						styles="w-16 h-16 rounded-full border-2 border-green-600"
						width={72}
						height={72}
						alt="user"
						lazy={true}
					/>
				</div>
			) : (
				<div className="w-16 h-16 rounded-full bg-gray-300"></div>
			)}
			<div className="ml-3">
				<p className="text-base font-bold">
					{first} {last}
				</p>
				<p className="text-sm text-gray-800">
					{city}, {country}
				</p>
				<p className="text-sm text-gray-500 break-all">{email}</p>
			</div>
		</div>
	);
};

export default UserCard;
