import React, { useState, useEffect } from 'react';
import { FaAngleUp } from 'react-icons/fa';

import styles from './index.css';

const ScrollToTop = () => {
	const [showTopBtn, setShowTopBtn] = useState(false);
	useEffect(() => {
		window.addEventListener('scroll', () => setShowTopBtn(() => (window.scrollY > 500 ? true : false)));
	}, []);
	const goToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth',
		});
	};
	return (
		<div className={styles['top-to-btm']}>
			{' '}
			{showTopBtn && (
				<FaAngleUp className={styles['icon-position'] + ' ' + styles['icon-style']} onClick={goToTop} />
			)}{' '}
		</div>
	);
};
export default ScrollToTop;
