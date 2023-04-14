import React, { forwardRef, useState, useEffect } from 'react';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const Checkbox = forwardRef(
	({ label, name, value, onChange, defaultChecked, ...rest }, forwardedRef) => {
		const [checked, setChecked] = useState(defaultChecked);

		const handleChange = () => (e) => setChecked(e.target.checked);

		useEffect(() => {
			safelyExecuteFunction(onChange, checked);
		}, [checked]);

		return (
			<div style={{ cursor: 'pointer' }}>
				<input
					style={{ display: 'none' }}
					ref={forwardedRef}
					type="checkbox"
					name={name}
					value={value}
					checked={checked}
					onChange={handleChange()}
				/>
				[{checked ? 'X' : ' '}]{label}
			</div>
		);
	},
);

export default Checkbox;
