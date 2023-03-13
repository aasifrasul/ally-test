import React, { forwardRef, useState, useEffect, useRef } from 'react';

import useCombinedRefs from '../../../hooks/useCombinedRefs';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const CombinedRefCheckbox = forwardRef(
	({ label, name, value, callback, defaultChecked = false, ...rest }, forwardedRef) => {
		const [checked, setChecked] = useState(defaultChecked);

		const innerRef = useRef(null);
		const combinedRef = useCombinedRefs(forwardedRef, innerRef);

		const setCheckedInput = (checked) => {
			if (innerRef.current.checked !== checked) {
				// just emulate an actual click on the input element
				innerRef.current.click();
			}
		};

		const handleChecked = () => (e) => setChecked(e.target.checked);

		useEffect(() => {
			setCheckedInput(checked);
			safelyExecuteFunction(callback, checked);
		}, [checked]);

		return (
			<div onClick={() => setChecked(!checked)} style={{ cursor: 'pointer' }}>
				<input
					style={{ display: 'none' }}
					ref={combinedRef}
					type="checkbox"
					name={name}
					value={value}
					defaultChecked={defaultChecked}
					onChange={handleChecked()}
				/>
				[{checked ? 'X' : ' '}]{label}
			</div>
		);
	},
);

export default CombinedRefCheckbox;
