interface StatisticProps {
	label?: string;
	value: string | number;
	color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
	size?: 'sm' | 'md' | 'lg';
}

export const Statistic: React.FC<StatisticProps> = ({ 
	label, 
	value, 
	color = 'blue',
	size = 'md' 
}) => {
	const colorClasses = {
		blue: 'text-blue-600',
		green: 'text-green-600',
		red: 'text-red-600',
		yellow: 'text-yellow-600',
		purple: 'text-purple-600'
	};

	const sizeClasses = {
		sm: 'text-xl',
		md: 'text-3xl',
		lg: 'text-5xl'
	};

	return (
		<div className="text-center">
			<div className={`font-bold ${colorClasses[color]} ${sizeClasses[size]}`}>
				{value}
			</div>
			{label && (
				<div className="text-gray-600 text-sm uppercase tracking-wide mt-1">
					{label}
				</div>
			)}
		</div>
	);
};
