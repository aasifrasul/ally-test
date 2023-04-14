import React from 'react';
import { isUndefined } from '../utils/typeChecking';

const useToggle = () => {
	const [active, setActive] = React.useState(false);
	return {
		active,
		setActive: (data) => setActive((state) => (isUndefined(data) ? !state : data)),
	};
};

export default useToggle;
