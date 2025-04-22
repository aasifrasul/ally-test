import React, { useState } from 'react';

const ZERO_KEYCODE = 48;
const NINE_KEYCODE = 57;

interface useOTPType {
	value?: string;
	OTPLength: number;
}

const useOTP = ({ value = '', OTPLength }: useOTPType) => {
	const [activeInput, setActiveInput] = useState(0);
	const [OTP, setOtp] = useState(value);

	const getOtpValue = () => (OTP ? OTP.toString().split('') : []);
	// Helper to return OTP from input
	const handleOtpChange = (otp: string[]) => {
		let otpValue = otp.join('');
		setOtp(otpValue);
		// onChange(otpValue)
	};

	// Focus on input by index
	const focusInput = (input: number) => {
		const nextActiveInput = Math.max(Math.min(OTPLength - 1, input), 0);

		setActiveInput(nextActiveInput);
	};

	const focusInputByDirection = (direction = 'next') => {
		focusInput(direction === 'next' ? activeInput + 1 : activeInput - 1);
	};

	// Change OTP value at focused input
	const changeActiveInputValue = (nextValue: string) => {
		if (nextValue.length > 1) {
			nextValue = (+nextValue % 10).toString();
		}
		const otp = getOtpValue();
		otp[activeInput] = nextValue;
		handleOtpChange(otp);
	};

	const isValidChar = (char: string) => {
		return !(char.charCodeAt(0) > NINE_KEYCODE || char.charCodeAt(0) < ZERO_KEYCODE);
	};

	const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text: string = e.target.value;
		if (isValidChar(text)) {
			changeActiveInputValue(text);
			focusInputByDirection('next');
		}
	};

	// Handle cases of backspace, delete, left arrow, right arrow
	const handleOnKeyDown = (e: any) => {
		if (e.keyCode == 8 || e.keyCode == 46) {
			e.preventDefault();
			changeActiveInputValue(' ');
			focusInputByDirection('prev');
		}
	};

	const handleOnInput = (e: any) => {
		if (e.target.value.length > 1) {
			e.preventDefault();
			focusInputByDirection('next');
		}
	};

	const onInputFocus = (index: number, event: any) => {
		setActiveInput(index);
		event.target.select();
	};

	return {
		OTP,
		activeInput,
		handleOnChange,
		handleOnKeyDown,
		handleOnInput,
		onInputFocus,
	};
};

export default useOTP;
