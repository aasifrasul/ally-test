import React from 'react';
import { isNumber } from '../../../utils/typeChecking';

type SpacerSize = number | string;
type SpacerAxis = 'vertical' | 'horizontal' | 'both';

interface SpacerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	/** Size of the spacer in pixels (number) or any valid CSS unit (string) */
	size: SpacerSize;
	/** Direction of spacing. Defaults to 'vertical' */
	axis?: SpacerAxis;
	/** Custom styles to override defaults */
	style?: React.CSSProperties;
	/** Whether to use inline-block display instead of block */
	inline?: boolean;
}

const DIMENSION_CONFIGS = {
	horizontal: (size: string) => ({
		width: size,
		minWidth: size,
		height: '1px',
		minHeight: '1px',
	}),
	vertical: (size: string) => ({
		width: '1px',
		minWidth: '1px',
		height: size,
		minHeight: size,
	}),
	both: (size: string) => ({ width: size, minWidth: size, height: size, minHeight: size }),
} as const;

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(
	({ size, axis = 'vertical', style = {}, inline = false, ...delegated }, ref) => {
		// Convert size to CSS value
		const cssSize = isNumber(size) ? `${size}px` : size;
		const dimensions = DIMENSION_CONFIGS[axis](cssSize);

		return (
			<div
				ref={ref}
				style={{
					display: inline ? 'inline-block' : 'block',
					flexShrink: 0, // Prevent shrinking in flex containers
					...dimensions,
					...style,
				}}
				aria-hidden="true" // Hide from screen readers as it's purely visual
				{...delegated}
			/>
		);
	},
);

Spacer.displayName = 'Spacer';

export default Spacer;

// Convenience components for common use cases
export const VerticalSpacer = React.forwardRef<HTMLDivElement, Omit<SpacerProps, 'axis'>>(
	(props, ref) => <Spacer {...props} axis="vertical" ref={ref} />,
);

export const HorizontalSpacer = React.forwardRef<HTMLDivElement, Omit<SpacerProps, 'axis'>>(
	(props, ref) => <Spacer {...props} axis="horizontal" ref={ref} />,
);

VerticalSpacer.displayName = 'VerticalSpacer';
HorizontalSpacer.displayName = 'HorizontalSpacer';
