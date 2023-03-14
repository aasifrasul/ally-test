import React, { forwardRef, useState, useEffect, useRef } from 'react';

import useCombinedRefs from '../../../hooks/useCombinedRefs';

import { safelyExecuteFunction } from '../../../utils/typeChecking';

const CombinedRefCheckbox = forwardRef(
	({ label, name, value, callback, isCheckedRef, defaultChecked = false, ...rest }, forwardedRef) => {
		const [checked, setChecked] = useState(defaultChecked);

		const innerRef = useRef(null);
		const combinedRef = useCombinedRefs(forwardedRef, innerRef);

		const setCheckedInput = (checked) => {
			if (innerRef.current.checked !== checked) {
				// just emulate an actual click on the input element
				innerRef.current.click();
			}
		};

		const handleChecked = () => (e) =>
			setChecked(() => {
				return !checked;
			});

		useEffect(() => {
			setCheckedInput(checked);
			isCheckedRef.current = checked;
			safelyExecuteFunction(callback, checked);
		}, [checked]);

		return (
			<div style={{ cursor: 'pointer' }}>
				<label htmlFor="my-checkbox">
					<input
						id="my-checkbox"
						style={{ display: 'none' }}
						ref={combinedRef}
						type="checkbox"
						name={name}
						value={value}
						defaultChecked={defaultChecked}
						onChange={handleChecked()}
					/>
					[{checked ? 'X' : ' '}]{label}
				</label>
			</div>
		);
	}
);

export default CombinedRefCheckbox;
