import React, { useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ children }) => {
	const el = useRef(null);

	if (!el.current) el.current = document.createElement('div');

	useEffect(() => {
		const modalRoot = document.querySelector('#modal-root');
		modalRoot.appendChild(el.current);

		return () => modalRoot.removeChild(el.current);
	}, []);

	return createPortal(children, el.current);
};

export default memo(Modal);
