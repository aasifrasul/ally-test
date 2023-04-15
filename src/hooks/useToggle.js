import React from 'react';
import { isUndefined } from '../utils/typeChecking';

const useToggle = () => {
	const [isOn, setIsOn] = React.useState(false);
	return [isOn, (data) => setIsOn((state) => (isUndefined(data) ? !state : data))];
};

export default useToggle;
