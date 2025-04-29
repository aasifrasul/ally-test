import React from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
	container: HTMLElement | null;
	children: React.ReactNode;
}

// Corrected Portal component with proper TypeScript types
export default function Portal({ container, children }: PortalProps) {
	const [isMounted, setIsMounted] = React.useState(false);
	const rootRef = React.useRef<HTMLDivElement | null>(null);

	React.useEffect(() => {
		if (!container) return;

		// Create the root element once
		if (!rootRef.current) {
			rootRef.current = document.createElement('div');
		}

		// Append to container
		container.appendChild(rootRef.current);
		setIsMounted(true);

		// Cleanup on unmount
		return () => {
			if (rootRef.current && container.contains(rootRef.current)) {
				container.removeChild(rootRef.current);
			}
		};
	}, [container]);

	return isMounted && rootRef.current ? createPortal(children, rootRef.current) : null;
}
