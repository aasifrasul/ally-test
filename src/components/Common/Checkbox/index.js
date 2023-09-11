import React, { useState } from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const Checkbox = ({ id, label = '', name = '', style = '', callback, value = null }) => {
	const [isChecked, setIsChecked] = useState(false);

	React.useEffect(() => {
		return () => setIsChecked(() => false);
	}, []);

	const handleChange = () => (e) => {
		console.log('isChecked', isChecked);
		setIsChecked((checked) => !checked);
		safelyExecuteFunction(callback, null, isChecked, id);
	};

	return (
		<label>
			<input
				id={id}
				type="checkbox"
				className={style}
				name={name}
				checked={isChecked}
				onChange={handleChange()}
			/>
			{label || name}
		</label>
	);
};

export default Checkbox;
