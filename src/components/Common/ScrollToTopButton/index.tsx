import React, { useState, useCallback } from 'react';
import { FaAngleUp } from 'react-icons/fa';

import { useEventListener } from '../../../hooks/useEventListener';

import styles from './index.module.css';

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
		<div className={'top-to-btm'}>
			{showTopBtn && (
				<FaAngleUp
					className={`${styles['icon-position']} ${styles['icon-style']}`}
					onClick={goToTop}
				/>
			)}
		</div>
	);
};

export default ScrollToTop;
