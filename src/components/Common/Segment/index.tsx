interface SegmentProps {
	children: React.ReactNode;
	className?: string;
	raised?: boolean;
	padded?: boolean;
}

export const Segment: React.FC<SegmentProps> = ({
	children,
	className = '',
	raised = false,
	padded = true,
}) => {
	const baseClasses = 'bg-white border border-gray-200 rounded-lg';
	const shadowClass = raised ? 'shadow-lg' : 'shadow-sm';
	const paddingClass = padded ? 'p-6' : 'p-0';

	return (
		<div className={`${baseClasses} ${shadowClass} ${paddingClass} ${className}`}>
			{children}
		</div>
	);
};
