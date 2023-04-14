import React, { useEffect, useState } from 'react';
import useToggle from './useToggle';

// Hook that alerts clicks outside of the passed ref
const useOutsideClick = (ref) => {
	const { active: clickedOutside, setActive } = useToggle();
	const handleClickOutside = (event) =>
		setActive(ref.current && !ref.current.contains(event.target) ? true : false);

	useEffect(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [ref]);

	return clickedOutside;
};

export default useOutsideClick;
