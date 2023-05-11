import { useState } from 'react';

//maintains a counter value with increment and decrement function
//if initial count value is not passed takes 0 as default
const useCounter: object = (initCount: number = 0) => {
	const [count, setCount] = useState(initCount);

	const increment = () => setCount((data) => data + 1);
	const decrement = () => setCount((data) => data - 1);
	const reset = (value: number) => setCount(value);

	return {
		count,
		increment,
		decrement,
		reset,
	};
};

export default useCounter;
