import React from 'react';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	orientation?: 'horizontal' | 'vertical';
	width?: string;
	height?: string;
	color?: string;
	inline?: boolean;
}

interface DefaultStyle {
	horizontal: React.CSSProperties;
	vertical: React.CSSProperties;
}

const Separator: React.FC<SeparatorProps> = ({
	className = '',
	orientation = 'horizontal',
	width = '20px',
	height = 'max-content',
	color = 'bg-gray-200',
	inline = false,
	...props
}) => {
	const defaultStyles: DefaultStyle = {
		horizontal: {
			width: width === '100%' ? '100%' : width,
			height: '1px',
			display: inline ? 'inline-block' : 'block',
		},
		vertical: {
			width: '1px',
			height: height === '100%' ? '100%' : height,
			display: 'inline-block',
			verticalAlign: 'middle',
		},
	};

	const styles =
		orientation === 'horizontal' ? defaultStyles.horizontal : defaultStyles.vertical;

	return (
		<div
			role="separator"
			style={styles}
			className={`
                ${color}
                ${orientation === 'horizontal' ? 'my-2' : 'mx-2'}
                ${className}
            `}
			{...props}
		/>
	);
};

export default Separator;
