import React from 'react';

function Button({ isDisabled, title, text, onClick, style }) {
	const attributes = {
		title,
		onClick,
		style,
	};

	if (isDisabled) {
		attributes.disabled = true;
		attributes.title = 'Button is disabled';
	}

	return <button {...attributes}>{text}</button>;
}

export default Button;
