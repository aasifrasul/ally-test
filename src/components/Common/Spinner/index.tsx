import React from 'react';
import clsx from 'clsx';
import { Icon } from '../Icon';
import { isString } from '../../../utils/typeChecking';

export enum Shape {
	REGULAR_CIRCLE = 'regularCircle',
	JAGGED_CIRCLE = 'jaggedCircle',
}
interface SpinnerDefaultProps {
	size: number;
	style: React.CSSProperties;
	testAutomationId: string;
	shapeName?: Shape;
}

interface SpinnerProps extends SpinnerDefaultProps {
	className?: string;
	icon?: React.ReactElement;
	children?: React.ReactNode;
}

export class Spinner extends React.Component<SpinnerProps> {
	static defaultProps: SpinnerDefaultProps = {
		size: 14,
		style: {},
		testAutomationId: 'spinner',
		shapeName: Shape.JAGGED_CIRCLE,
	};

	render() {
		let { icon, size, testAutomationId, style, className, shapeName, children, ...props } =
			this.props;

		className = clsx(
			'rc-spinner',
			{ 'rc-spinner-regularCircle': shapeName === Shape.REGULAR_CIRCLE },
			className,
		);
		style = {
			...style,
			fontSize: (style as any).fontSize || size + 'px',
		};

		if (icon) {
			if (isString(icon)) {
				children = <Icon name={icon} />;
			} else {
				children = icon;
			}
		}

		const viewBox = shapeName === Shape.REGULAR_CIRCLE ? '22 22 44 44' : '0 0 14 14';

		return (
			<span
				data-test-automation-id={testAutomationId}
				className={className}
				style={style}
				{...props}
			>
				{children || (
					<svg width={size} height={size} viewBox={viewBox}>
						{shapeName === Shape.JAGGED_CIRCLE ? (
							<g>
								<path
									className="o12"
									d="M7.1,3.5H6.9c-0.3,0-0.5-0.2-0.5-0.5V0.5C6.3,0.2,6.6,0,6.9,0h0.2c0.3,0,0.5,0.2,0.5,0.5v2.4 C7.7,3.2,7.4,3.5,7.1,3.5z"
								/>
								<path
									className="o11"
									d="M5.3,3.9L5.1,4C4.9,4.1,4.5,4.1,4.4,3.8L3.2,1.7C3.1,1.5,3.1,1.1,3.4,1l0.2-0.1c0.3-0.1,0.6-0.1,0.7,0.2 l1.2,2.1C5.7,3.4,5.6,3.7,5.3,3.9z"
								/>
								<path
									className="o10"
									d="M4,5.1L3.9,5.3C3.7,5.6,3.4,5.7,3.1,5.5L1.1,4.3C0.8,4.2,0.7,3.9,0.9,3.6L1,3.4c0.1-0.3,0.5-0.3,0.7-0.2 l2.1,1.2C4.1,4.5,4.1,4.9,4,5.1z"
								/>
								<path
									className="o9"
									d="M3.5,6.9v0.2c0,0.3-0.2,0.5-0.5,0.5H0.5C0.2,7.7,0,7.4,0,7.1l0-0.2c0-0.3,0.2-0.5,0.5-0.5h2.4 C3.2,6.3,3.5,6.6,3.5,6.9z"
								/>
								<path
									className="o8"
									opacity="0.6"
									d="M3.9,8.7L4,8.9c0.1,0.3,0.1,0.6-0.2,0.7l-2.1,1.2c-0.3,0.1-0.6,0.1-0.7-0.2l-0.1-0.2c-0.1-0.3-0.1-0.6,0.2-0.7 l2.1-1.2C3.4,8.3,3.7,8.4,3.9,8.7z"
								/>
								<path
									className="o7"
									d="M5.1,10l0.2,0.1c0.3,0.1,0.3,0.5,0.2,0.7l-1.2,2.1c-0.1,0.3-0.5,0.3-0.7,0.2L3.4,13c-0.3-0.1-0.3-0.5-0.2-0.7 l1.2-2.1C4.5,9.9,4.9,9.9,5.1,10z"
								/>
								<path
									className="o6"
									d="M7.1,14H6.9c-0.3,0-0.5-0.2-0.5-0.5v-2.4c0-0.3,0.2-0.5,0.5-0.5h0.2c0.3,0,0.5,0.2,0.5,0.5v2.4 C7.7,13.8,7.4,14,7.1,14z"
								/>
								<path
									className="o5"
									d="M10.6,13l-0.2,0.1c-0.3,0.1-0.6,0.1-0.7-0.2l-1.2-2.1c-0.1-0.3-0.1-0.6,0.2-0.7L8.9,10c0.3-0.1,0.6-0.1,0.7,0.2 l1.2,2.1C10.9,12.5,10.9,12.9,10.6,13z"
								/>
								<path
									className="o4"
									d="M13.1,10.4L13,10.6c-0.1,0.3-0.5,0.3-0.7,0.2l-2.1-1.2C9.9,9.5,9.9,9.1,10,8.9l0.1-0.2c0.1-0.3,0.5-0.3,0.7-0.2 l2.1,1.2C13.2,9.8,13.3,10.1,13.1,10.4z"
								/>
								<path
									className="o3"
									d="M14,6.9v0.2c0,0.3-0.2,0.5-0.5,0.5h-2.4c-0.3,0-0.5-0.2-0.5-0.5V6.9c0-0.3,0.2-0.5,0.5-0.5h2.4 C13.8,6.3,14,6.6,14,6.9z"
								/>
								<path
									className="o2"
									d="M13,3.4l0.1,0.2c0.1,0.3,0.1,0.6-0.2,0.7l-2.1,1.2c-0.3,0.1-0.6,0.1-0.7-0.2L10,5.1c-0.1-0.3-0.1-0.6,0.2-0.7 l2.1-1.2C12.5,3.1,12.9,3.1,13,3.4z"
								/>
								<path
									className="o1"
									d="M10.4,0.9L10.6,1c0.3,0.1,0.3,0.5,0.2,0.7L9.6,3.8C9.5,4.1,9.1,4.1,8.9,4L8.7,3.9C8.4,3.7,8.3,3.4,8.5,3.1 l1.2-2.1C9.8,0.8,10.1,0.7,10.4,0.9z"
								/>
							</g>
						) : (
							<circle cx="44" cy="44" r="20.2" fill="none" strokeWidth="3.6" />
						)}
					</svg>
				)}
			</span>
		);
	}
}
