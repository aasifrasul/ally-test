import React, { CSSProperties } from 'react';

interface ProgressBarProps {
	bgcolor: string;
	completed: number;
}

const ProgressBar = (props: ProgressBarProps) => {
	const { bgcolor, completed } = props;

	const containerStyles: CSSProperties = {
		height: 20,
		width: '100%',
		backgroundColor: '#e0e0de',
		borderRadius: 50,
		margin: 50,
	};

	const fillerStyles: CSSProperties = {
		height: '100%',
		width: `${completed}%`,
		backgroundColor: bgcolor,
		borderRadius: 'inherit',
		textAlign: 'right',
		transition: 'width 1s ease-in-out',
	};

	const labelStyles: CSSProperties = {
		padding: 5,
		color: 'white',
		fontWeight: 'bold',
	};

	return (
		<div style={containerStyles}>
			<div style={fillerStyles}>
				<span
					role="progressbar"
					aria-valuenow={completed}
					aria-valuemin={0}
					aria-valuemax={100}
				>{`${completed}%`}</span>
			</div>
		</div>
	);
};

export default ProgressBar;
