interface IconProps {
	name: string;
	size?: 'tiny' | 'small' | 'large' | 'big' | 'huge' | 'massive';
	color?:
		| 'red'
		| 'orange'
		| 'yellow'
		| 'olive'
		| 'green'
		| 'teal'
		| 'blue'
		| 'violet'
		| 'purple'
		| 'pink'
		| 'brown'
		| 'grey'
		| 'black';
	className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 'small', color, className = '' }) => {
	const sizeClasses = {
		tiny: 'w-3 h-3',
		small: 'w-4 h-4',
		large: 'w-6 h-6',
		big: 'w-8 h-8',
		huge: 'w-12 h-12',
		massive: 'w-16 h-16',
	};

	const colorClasses = {
		red: 'text-red-500',
		orange: 'text-orange-500',
		yellow: 'text-yellow-500',
		olive: 'text-yellow-600',
		green: 'text-green-500',
		teal: 'text-teal-500',
		blue: 'text-blue-500',
		violet: 'text-violet-500',
		purple: 'text-purple-500',
		pink: 'text-pink-500',
		brown: 'text-amber-700',
		grey: 'text-gray-500',
		black: 'text-black',
	};

	// Simple icon mapping - you can expand this or use a proper icon library
	const getIconSvg = (iconName: string) => {
		switch (iconName) {
			case 'user':
				return (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				);
			case 'home':
				return (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				);
			case 'settings':
				return (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
				);
			case 'plus':
				return (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 4v16m8-8H4"
					/>
				);
			case 'edit':
				return (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				);
			case 'delete':
			case 'trash':
				return (
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				);
			default:
				return <circle cx="12" cy="12" r="10" />;
		}
	};

	const colorClass = color ? colorClasses[color] : 'text-current';

	return (
		<svg
			className={`${sizeClasses[size]} ${colorClass} ${className}`}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			{getIconSvg(name)}
		</svg>
	);
};
