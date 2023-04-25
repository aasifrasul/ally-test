import Raect from 'react';
import { createPortal } from 'react-dom';

export default function Portal(props) {
	const { container, children } = props;
	const root = document.createElement('div');
	container.appendChild(root);

	return createPortal(children, root);
}
