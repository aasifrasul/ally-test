import React from 'react';
import clsx from 'clsx';
import { Spinner as SpinnerInner, Shape } from './Spinner';
import styles from './styles.module.css';

export enum SpinnerPlacement {
	INLINE = 'inline',
	CENTER = 'center',
	FULLSCREEN = 'fullscreen',
	ABSOLUTE = 'absolute',
}

interface SpinnerContainerProps {
	placement?: SpinnerPlacement;
	size?: number;
	className?: string;
	style?: React.CSSProperties;
	backdrop?: boolean;
}

export const Spinner: React.FC<SpinnerContainerProps> = ({
	placement = SpinnerPlacement.INLINE,
	size = 32,
	backdrop = false,
	className,
	style,
}) => {
	return (
		<div
			className={clsx(
				styles['rc-spinner-container'],
				styles[`rc-spinner-${placement}`],
				{ [styles['rc-spinner-backdrop']]: backdrop },
				className,
			)}
			style={style}
		>
			<SpinnerInner size={size} shapeName={Shape.JAGGED_CIRCLE} />
		</div>
	);
};
