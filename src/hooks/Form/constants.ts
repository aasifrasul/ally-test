export const PATTERNS = {
	email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
	phone: /^\+?[\d\s-]{10,}$/,
	url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
	password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
	zipCode: /^\d{5}(-\d{4})?$/,
	username: /^[a-zA-Z0-9_]{3,20}$/,
};
