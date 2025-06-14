interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	primary?: boolean;
	secondary?: boolean;
	positive?: boolean;
	negative?: boolean;
	basic?: boolean;
	size?: 'mini' | 'tiny' | 'small' | 'medium' | 'large' | 'big' | 'huge' | 'massive';
	fluid?: boolean;
	loading?: boolean;
	icon?: boolean;
	children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
	primary = false,
	secondary = false,
	positive = false,
	negative = false,
	basic = false,
	size = 'medium',
	fluid = false,
	loading = false,
	icon = false,
	disabled,
	children,
	className = '',
	...props
}) => {
	const baseClasses =
		'inline-flex items-center justify-center font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

	let colorClasses = 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500';

	if (primary) colorClasses = 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
	if (secondary)
		colorClasses = 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500';
	if (positive)
		colorClasses = 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500';
	if (negative) colorClasses = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';

	if (basic) {
		colorClasses =
			'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500';
		if (primary)
			colorClasses =
				'border border-blue-300 bg-white hover:bg-blue-50 text-blue-700 focus:ring-blue-500';
		if (positive)
			colorClasses =
				'border border-green-300 bg-white hover:bg-green-50 text-green-700 focus:ring-green-500';
		if (negative)
			colorClasses =
				'border border-red-300 bg-white hover:bg-red-50 text-red-700 focus:ring-red-500';
	}

	const sizeClasses = {
		mini: 'px-2 py-1 text-xs',
		tiny: 'px-2 py-1 text-xs',
		small: 'px-3 py-1.5 text-sm',
		medium: 'px-4 py-2 text-sm',
		large: 'px-6 py-3 text-base',
		big: 'px-8 py-4 text-lg',
		huge: 'px-10 py-5 text-xl',
		massive: 'px-12 py-6 text-2xl',
	};

	const widthClass = fluid ? 'w-full' : '';
	const iconClass = icon ? 'p-2' : '';

	const classes = `${baseClasses} ${colorClasses} ${sizeClasses[size]} ${widthClass} ${iconClass} ${className}`;

	return (
		<button className={classes} disabled={disabled || loading} {...props}>
			{loading && (
				<svg
					className="animate-spin -ml-1 mr-2 h-4 w-4"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
			)}
			{children}
		</button>
	);
};

export default Button;
