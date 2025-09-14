import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import { useDocumentEventListener } from '../../../hooks';

import { createLogger, LogLevel, Logger } from '../../../utils/Logger';

import styles from './Modal.module.css';

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

const logger: Logger = createLogger('Modal', {
	level: LogLevel.DEBUG,
});

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

		useDocumentEventListener('keydown', (e: WindowEventMap['keydown']): void => {
			if (e.key === 'Escape' && closeOnEscape && onClose) {
				onClose();
			}
		});

		// Handle backdrop click
		const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
			if (e.target === e.currentTarget && closeOnBackdropClick && onClose) {
				onClose();
			}
		};

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
		}, [isOpen, preventBodyScroll]);

		// Focus trap
		const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
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
		};

		if (!isOpen) return null;

		// Get portal target element
		const portalElement = document.getElementById(portalTarget);
		if (!portalElement) {
			logger.warn(
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
