import React from 'react';

import './index.css';

type IconSizes = 'small' | 'medium' | 'large';

interface HTMLAccessibilityProps {
	ariaHidden?: boolean;
	ariaLabel?: string;
	role?: string;
}

type HTMLElementClickHandler = (event: React.MouseEvent<HTMLElement>) => void;

interface IconProps extends HTMLAccessibilityProps {
	name: string;
	size?: IconSizes;
	testAutomationId?: string;
	className?: string;
	onClick?: HTMLElementClickHandler;
}

export class Icon extends React.Component<IconProps> {
	static defaultProps: Partial<IconProps> = {
		testAutomationId: 'icon',
		ariaHidden: true,
	};

	render() {
		const { testAutomationId, className, name, ariaHidden, ariaLabel, size, ...props } =
			this.props;

		const iconClassName = [
			'rc-icon',
			`rc-icon-${name}`,
			size && `rc-icon-${size}`,
			className,
		]
			.filter(Boolean)
			.join(' ');

		if (!ariaHidden) {
			props.role = 'img';
			props['aria-label'] = ariaLabel || 'icon';
		}

		if (name) {
			return (
				<span
					data-test-automation-id={testAutomationId}
					className={iconClassName}
					aria-hidden={ariaHidden}
					{...props}
				/>
			);
		}
		return null;
	}
}
