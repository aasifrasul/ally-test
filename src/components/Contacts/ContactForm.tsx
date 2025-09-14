import { useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '../Common/Button';
import { InputText } from '../Common/InputText';

import { FormData } from './types';
import { addContact } from './ActionCreators';

function ContactForm() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
	});
	const dispatch = useDispatch();

	const handleNameChange = (name: string) => {
		setFormData((prev: FormData) => ({
			...prev,
			name,
		}));
	};

	const handleEmailChange = (email: string) => {
		setFormData((prev: FormData) => ({
			...prev,
			email,
		}));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		// Dispatch action
		dispatch(
			addContact({
				id: Math.floor(Math.random() * 1000),
				name: formData.name,
				email: formData.email,
			}),
		);
		// Reset form
		setFormData({ name: '', email: '' });
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<InputText
					name="name"
					placeholder="Enter Name"
					label="Name"
					initialValue={formData.name}
					debounceMs={250}
					onChange={handleNameChange}
					required
					className="w-full"
				/>

				<InputText
					name="email"
					type="email"
					label="Email"
					placeholder="Enter Email"
					initialValue={formData.email}
					debounceMs={250}
					onChange={handleEmailChange}
					required
					className="w-full"
				/>

				<Button type="submit" className="w-full h-10 mt-8">
					New Contact
				</Button>
			</div>
		</form>
	);
}

export default ContactForm;
