import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Tooltip } from '../Tooltip';
import * as styles from './AdvancedTruncate.module.css';

interface Props {
	text: string;
	maxLength?: number;
	customClass?: string;
}

const AdvancedTruncate = ({ text, maxLength = 100, customClass = '' }: Props) => {
	const [showTooltip, setShowTooltip] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLSpanElement>(null);

	const isTruncated = text.length > maxLength;
	const truncatedText = isTruncated ? `${text.substring(0, maxLength)}...` : text;

	// Handle mouse events directly
	const handleMouseEnter = useCallback(() => {
		if (isTruncated) {
			const timer = setTimeout(() => {
				setIsHovered(true);
				setShowTooltip(true);
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [isTruncated]);

	const handleMouseLeave = useCallback(() => {
		const timer = setTimeout(() => {
			setIsHovered(false);
			setShowTooltip(false);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	// Handle keyboard interactions
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Escape') {
				setShowTooltip(false);
			} else if ((event.key === 'Enter' || event.key === ' ') && isTruncated) {
				setShowTooltip((prev) => !prev);
				event.preventDefault();
			}
		},
		[isTruncated],
	);

	// Close tooltip when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setShowTooltip(false);
			}
		};

		if (showTooltip) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showTooltip]);

	return (
		<div className={styles.container} ref={containerRef}>
			<span
				ref={triggerRef}
				className={`${customClass} ${isTruncated ? styles.truncated : ''}`}
				role="button"
				tabIndex={isTruncated ? 0 : -1}
				aria-expanded={showTooltip}
				aria-describedby={showTooltip ? 'tooltip-content' : undefined}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				onKeyDown={handleKeyDown}
			>
				{truncatedText}
			</span>
			<Tooltip isOpen={showTooltip} triggerRef={triggerRef}>
				<div id="tooltip-content">{text}</div>
			</Tooltip>
		</div>
	);
};

export default AdvancedTruncate;
