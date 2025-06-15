import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import * as styles from './styles.module.css';

interface TooltipProps {
	children: React.ReactNode;
	isOpen: boolean;
	triggerRef: React.RefObject<HTMLElement | null>;
}

export const Tooltip = ({ children, isOpen, triggerRef }: TooltipProps) => {
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [isAbove, setIsAbove] = useState(false); // New state for arrow direction
	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen && triggerRef.current && tooltipRef.current) {
			const triggerRect = triggerRef.current.getBoundingClientRect();
			const tooltipRect = tooltipRef.current.getBoundingClientRect();
			const viewport = {
				width: window.innerWidth,
				height: window.innerHeight,
			};

			let newTop = triggerRect.bottom + 8; // 8px gap below trigger
			let newLeft = triggerRect.left;
			let above = false; // Initialize above flag

			// Adjust if tooltip would go off the right edge
			if (newLeft + tooltipRect.width > viewport.width - 16) {
				newLeft = viewport.width - tooltipRect.width - 16;
			}

			// Adjust if tooltip would go off the left edge
			if (newLeft < 16) {
				newLeft = 16;
			}

			// If tooltip would go off the bottom, show it above the trigger
			if (newTop + tooltipRect.height > viewport.height - 16) {
				newTop = triggerRect.top - tooltipRect.height - 8;
				above = true; // Set flag to true if positioned above
			}

			// If still off-screen at top, position it within viewport
			if (newTop < 16) {
				newTop = 16;
				above = false; // If forced to top, arrow should point up
			}

			setPosition({ top: newTop, left: newLeft });
			setIsAbove(above); // Update state for arrow direction
		}
	}, [isOpen, triggerRef]);

	if (!isOpen) return null;

	const portalElement = document.body;

	return ReactDOM.createPortal(
		<div
			ref={tooltipRef}
			className={`${styles.tooltip} ${isAbove ? styles.tooltipAbove : ''}`} // Conditionally add class
			style={{
				position: 'fixed',
				top: `${position.top}px`,
				left: `${position.left}px`,
				zIndex: 1000,
			}}
			role="tooltip"
		>
			<div className={styles.tooltipContent}>{children}</div>
		</div>,
		portalElement,
	);
};
