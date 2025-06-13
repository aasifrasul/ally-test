import React, { useState, useRef, useCallback, useEffect } from 'react';
import Modal from '../Modal';
import { useHover } from '../../../hooks/useHover';
import * as styles from './AdvancedTruncate.module.css';

interface Props {
	text: string;
	maxLength?: number;
	customClass?: string;
}

const AdvancedTruncate = ({ text, maxLength = 100, customClass = '' }: Props) => {
	const [showModal, setShowModal] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Use hover state to trigger modal
	const { hoverRef, isHovered } = useHover({
		enterDelay: 100,
		leaveDelay: 100,
	});

	const isTruncated = text.length > maxLength;
	const truncatedText = isTruncated ? `${text.substring(0, maxLength)}...` : text;

	// Update modal visibility based on hover state
	useEffect(() => {
		if (isHovered && isTruncated) {
			setShowModal(true);
		} else if (!isHovered) {
			const timeout = setTimeout(() => {
				setShowModal(false);
			}, 1000);
			return () => clearTimeout(timeout);
		}
	}, [isHovered, isTruncated]);

	// Handle keyboard interactions
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === 'Escape') {
				setShowModal(false);
			} else if ((event.key === 'Enter' || event.key === ' ') && isTruncated) {
				setShowModal((prev) => !prev);
			}
		},
		[isTruncated],
	);

	return (
		<div className={styles.container} ref={containerRef}>
			<span
				ref={hoverRef}
				className={`${customClass} ${isTruncated ? styles.truncated : ''}`}
				role="button"
				tabIndex={isTruncated ? 0 : -1}
				aria-expanded={showModal}
				onKeyDown={handleKeyDown}
			>
				{truncatedText}
			</span>
			<Modal isOpen={showModal}>
				<div className={styles.tooltip} role="tooltip">
					<div className={styles.tooltipContent}>{text}</div>
				</div>
			</Modal>
		</div>
	);
};

export default AdvancedTruncate;
