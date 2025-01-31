interface SpacerProps extends React.HTMLAttributes<HTMLSpanElement> {
	size: number;
	axis?: 'vertical' | 'horizontal';
	style?: React.CSSProperties;
}

const Spacer = ({ size, axis, style = {}, ...delegated }: SpacerProps) => {
	const width = axis === 'vertical' ? 1 : size;
	const height = axis === 'horizontal' ? 1 : size;

	return (
		<span
			style={{
				display: 'block',
				width,
				minWidth: width,
				height,
				minHeight: height,
				...style,
			}}
			{...delegated}
		/>
	);
};

export default Spacer;
