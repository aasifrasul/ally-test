import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
	container: HTMLElement | null;
	children: ReactNode;
	className?: string;
}

export default function Portal({
	container = document.body,
	children,
	className,
}: PortalProps) {
	const [isMounted, setIsMounted] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!container || typeof document === 'undefined') return;

		try {
			if (!rootRef.current) {
				rootRef.current = document.createElement('div');
				if (className) {
					rootRef.current.className = className;
				}
			}

			container.appendChild(rootRef.current);
			setIsMounted(true);

			return () => {
				if (rootRef.current && container.contains(rootRef.current)) {
					container.removeChild(rootRef.current);
				}
			};
		} catch (error) {
			console.error('Portal mount error:', error);
			setIsMounted(false);
		}
	}, [container]);

	return isMounted && rootRef.current ? createPortal(children, rootRef.current) : null;
}
/**
 * Simpler Approach
 * export default function Portal({ container, children }: PortalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !container) return null;
  
  return createPortal(children, container);
}
*/
