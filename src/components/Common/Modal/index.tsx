import React, { useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';

import { useEventListener } from '../../../hooks/EventListeners';

import * as styles from './Modal.module.css';

interface ModalProps {
	children: React.ReactNode;
	isOpen?: boolean;
	onClose?: () => void;
	closeOnBackdropClick?: boolean;
	closeOnEscape?: boolean;
	preventBodyScroll?: boolean;
	size?: 'small' | 'medium' | 'large';
	className?: string;
	ariaLabel?: string;
	ariaDescribedBy?: string;
	showCloseButton?: boolean;
	portalTarget?: string;
}

const Modal = React.memo(
	({
		children,
		isOpen = false,
		onClose,
		closeOnBackdropClick = true,
		closeOnEscape = true,
		preventBodyScroll = true,
		size = 'medium',
		className = '',
		ariaLabel,
		ariaDescribedBy,
		showCloseButton = true,
		portalTarget = 'modal-root',
	}: ModalProps) => {
		const modalRef = useRef<HTMLDivElement>(null);
		const previousActiveElement = useRef<HTMLElement | null>(null);

		// Handle escape key press
		const handleEscape = useCallback(
			(e: KeyboardEvent) => {
				if (e.key === 'Escape' && closeOnEscape && onClose) {
					onClose();
				}
			},
			[closeOnEscape, onClose],
		);

		useEventListener('keydown', handleEscape, document)

		// Handle backdrop click
		const handleBackdropClick = useCallback(
			(e: React.MouseEvent) => {
				if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
					onClose();
				}
			},
			[closeOnBackdropClick, onClose],
		);

		// Focus management
		useEffect(() => {
			if (isOpen) {
				// Store the currently focused element
				previousActiveElement.current = document.activeElement as HTMLElement;

				// Focus the modal
				if (modalRef.current) {
					modalRef.current.focus();
				}

				// Prevent body scroll
				if (preventBodyScroll) {
					document.body.style.overflow = 'hidden';
				}

				return () => {
					// Restore body scroll
					if (preventBodyScroll) {
						document.body.style.overflow = '';
					}

					// Restore focus to previous element
					if (previousActiveElement.current) {
						previousActiveElement.current.focus();
					}
				};
			}
		}, [isOpen, handleEscape, preventBodyScroll]);

		// Focus trap
		const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
			if (e.key === 'Tab' && modalRef.current) {
				const focusableElements = modalRef.current.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
				);

				const firstElement = focusableElements[0] as HTMLElement;
				const lastElement = focusableElements[
					focusableElements.length - 1
				] as HTMLElement;

				if (e.shiftKey) {
					// Shift + Tab
					if (document.activeElement === firstElement) {
						e.preventDefault();
						lastElement?.focus();
					}
				} else {
					// Tab
					if (document.activeElement === lastElement) {
						e.preventDefault();
						firstElement?.focus();
					}
				}
			}
		}, []);

		if (!isOpen) return null;

		// Get portal target element
		const portalElement = document.getElementById(portalTarget);
		if (!portalElement) {
			console.warn(
				`Modal portal target '${portalTarget}' not found. Modal will not render.`,
			);
			return null;
		}

		const modalClasses = [styles.modal, styles[`modal--${size}`], className]
			.filter(Boolean)
			.join(' ');

		return ReactDOM.createPortal(
			<div
				className={styles.backdrop}
				onClick={handleBackdropClick}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabel}
				aria-describedby={ariaDescribedBy}
			>
				<div
					ref={modalRef}
					className={modalClasses}
					tabIndex={-1}
					onKeyDown={handleKeyDown}
				>
					{showCloseButton && onClose && (
						<button
							className={styles['close-button']}
							onClick={onClose}
							aria-label="Close modal"
							type="button"
						>
							<span aria-hidden="true">&times;</span>
						</button>
					)}
					<div className={styles['modal-content']}>{children}</div>
				</div>
			</div>,
			portalElement,
		);
	},
);

Modal.displayName = 'Modal';

export default Modal;
