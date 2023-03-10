import React, { useState } from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const Checkbox = (props) => {
	const [checked, setChecked] = useState(false);
	const { label = '', name = '', style = '', callback, value = null } = props;
	const handleChange = () => (e) => {
		const { checked } = e.target;
		console.log('checked', checked);
		setChecked(checked);
		safelyExecuteFunction(callback, checked, value);
	};

	return (
		<label>
			<input
				type="checkbox"
				className={style}
				name={name}
				value={value}
				checked={checked}
				onChange={handleChange()}
			/>
			{label || name}
		</label>
	);
};

export default Checkbox;
