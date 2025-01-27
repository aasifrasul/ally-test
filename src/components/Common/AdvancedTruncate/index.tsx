import React, { useState } from 'react';

interface AdvancedTruncateProps {
	text: string;
	maxLength?: number;
	showFullTextButton?: boolean;
	customClass?: string;
}

const AdvancedTruncate: React.FC<AdvancedTruncateProps> = ({
	text,
	maxLength = 100,
	showFullTextButton = true,
	customClass = '',
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	// If text is shorter than max length, return full text
	if (text.length <= maxLength) {
		return <span className={customClass}>{text}</span>;
	}

	// Truncate or show full text based on state
	const displayText = isExpanded ? text : text.slice(0, maxLength);

	return (
		<div className={`relative ${customClass}`}>
			<span>
				{displayText}
				{!isExpanded && text.length > maxLength && '...'}
			</span>
			{showFullTextButton && text.length > maxLength && (
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="ml-2 text-blue-500 hover:underline text-sm"
				>
					{isExpanded ? 'Show Less' : 'Show More'}
				</button>
			)}
		</div>
	);
};

export default AdvancedTruncate;
