import React from 'react';
import { useDispatch } from 'react-redux';
import { Card } from '@/components/ui/card';
import Button from '../Common/Button';
import { InputText } from '../Common/InputText';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';

import { ChangeEvent, FormData } from './types';
import { addContact } from './ActionCreators';

function ContactForm() {
	const [formData, setFormData] = React.useState({
		name: '',
		email: '',
	});
	const dispatch = useDispatch();

	const handleChange = (e: ChangeEvent) => {
		const { name, value } = e.target;
		setFormData((prev: FormData) => ({
			...prev,
			[name]: value,
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
		<Card className="p-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<FormField>
						<FormItem>
							<FormLabel>Name</FormLabel>
							<InputText
								name="name"
								placeholder="Enter Name"
								value={formData.name}
								onChange={handleChange}
								required
								className="w-full"
							/>
						</FormItem>
					</FormField>

					<FormField>
						<FormItem>
							<FormLabel>Email</FormLabel>
							<InputText
								name="email"
								type="email"
								placeholder="Enter Email"
								value={formData.email}
								onChange={handleChange}
								required
								className="w-full"
							/>
						</FormItem>
					</FormField>

					<Button type="submit" className="w-full h-10 mt-8">
						New Contact
					</Button>
				</div>
			</form>
		</Card>
	);
}

export default ContactForm;
