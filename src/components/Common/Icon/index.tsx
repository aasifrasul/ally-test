import React from 'react';

type IconSizes = 'small' | 'medium' | 'large';

interface HTMLAccessibilityProps {
	ariaHidden?: boolean;
	ariaLabel?: string;
}

type HTMLElementClickHandler = React.MouseEventHandler<HTMLElement>;

interface IconProps extends HTMLAccessibilityProps, React.HTMLAttributes<HTMLElement> {
	/** Name of the icon to display */
	name: string;
	/** Size variant of the icon */
	size?: IconSizes;
	/** Test automation ID for e2e testing */
	testAutomationId?: string;
	/** Additional CSS classes */
	className?: string;
	/** Click handler */
	onClick?: HTMLElementClickHandler;
}

const Icon = React.memo((props: IconProps): JSX.Element | null => {
	const {
		testAutomationId = 'icon',
		ariaHidden = true,
		className,
		name,
		ariaLabel,
		size,
		onClick,
		...restProps
	} = props;
	if (!name) {
		throw new Error('Icon: name prop is required');
	}

	const iconClassName = React.useMemo(() => {
		return ['rc-icon', `rc-icon-${name}`, size && `rc-icon-${size}`, className]
			.filter(Boolean)
			.join(' ');
	}, [name, size, className]);

	const accessibilityProps = !ariaHidden
		? {
				role: 'img' as const,
				'aria-label': ariaLabel || 'icon',
			}
		: {};

	return (
		<span
			data-test-automation-id={testAutomationId}
			className={iconClassName}
			aria-hidden={ariaHidden}
			onClick={onClick}
			{...accessibilityProps}
			{...restProps}
		/>
	);
});

Icon.displayName = 'Icon';

export default Icon;
