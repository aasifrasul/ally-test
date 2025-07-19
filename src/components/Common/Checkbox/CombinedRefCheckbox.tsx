import React, { forwardRef, useState, useEffect, useRef, RefObject, ChangeEvent } from 'react';
import { useCombinedRefs } from '../../../hooks/useCombinedRefs';
import { safelyExecuteFunction } from '../../../utils/typeChecking';

interface CombinedRefCheckboxProps {
	label: string;
	name: string;
	value: string;
	callback?: (checked: boolean) => void;
	isCheckedRef: RefObject<boolean>;
	defaultChecked?: boolean;
	[key: string]: any; // For rest props
}

type CheckboxRef = HTMLInputElement;

const CombinedRefCheckbox = forwardRef<CheckboxRef, CombinedRefCheckboxProps>(
	(
		{ label, name, value, callback, isCheckedRef, defaultChecked = false, ...rest },
		forwardedRef,
	) => {
		const [checked, setChecked] = useState<boolean>(defaultChecked);
		const innerRef = useRef<CheckboxRef>(null);
		const combinedRef = useCombinedRefs(forwardedRef, innerRef);

		const setCheckedInput = (checked: boolean): void => {
			if (innerRef.current && innerRef.current.checked !== checked) {
				// just emulate an actual click on the input element
				innerRef.current.click();
			}
		};

		const handleChecked =
			() =>
			(e: ChangeEvent<HTMLInputElement>): void => {
				safelyExecuteFunction(callback, null, !checked);
				setChecked((isChecked) => !isChecked);
			};

		useEffect(() => {
			setCheckedInput(checked);
			if (isCheckedRef) {
				isCheckedRef.current = checked;
			}
		}, [checked, isCheckedRef]);

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
	},
);

export default CombinedRefCheckbox;
