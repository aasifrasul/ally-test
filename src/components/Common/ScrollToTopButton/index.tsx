import React, { useState, useCallback } from 'react';
import { useEventListener } from '../../../hooks';

const ScrollToTop: React.FC = () => {
	const [showTopBtn, setShowTopBtn] = useState<boolean>(false);

	const handleScroll = useCallback(() => {
		setShowTopBtn(window.scrollY > 500);
	}, []);

	useEventListener('scroll', handleScroll, window);

	const goToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};

	return (
		<>
			{showTopBtn && (
				<button
					onClick={goToTop}
					className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
					aria-label="Scroll to top"
				>
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
							clipRule="evenodd"
						/>
					</svg>
				</button>
			)}
		</>
	);
};

export default ScrollToTop;
