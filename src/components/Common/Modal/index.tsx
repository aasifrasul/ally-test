import React from 'react';
import ReactDOM from 'react-dom';

import * as styles from './Modal.module.css';

interface ModalProps {
	children: React.ReactNode;
	isOpen?: boolean;
}

const Modal = React.memo(({ children, isOpen }: ModalProps) => {
	if (!isOpen) return null;

	return ReactDOM.createPortal(
		<div className={styles.modal}>
			<div className={styles['modal-content']}>{children}</div>
		</div>,
		document.getElementById('modal-root') as HTMLElement,
	);
});

export default Modal;
