import { useState, useEffect } from 'react';

import { InputText } from '../Common/InputText';
import Button from '../Common/Button';
import { User, AddUser, UpdateUser } from './types';

interface UserFormProps {
	editingUser: User | null;
	addUser: AddUser;
	updateUser: UpdateUser;
}

interface FormData {
	firstName: string;
	lastName: string;
	age: string;
}

const initialFormData: FormData = {
	firstName: '',
	lastName: '',
	age: '',
};

export const UserForm = ({ editingUser, addUser, updateUser }: UserFormProps) => {
	const [formData, setFormData] = useState<FormData>(initialFormData);

	// Update form when editingUser changes
	useEffect(() => {
		if (editingUser) {
			setFormData({
				firstName: editingUser.first_name || '',
				lastName: editingUser.last_name || '',
				age: editingUser.age?.toString() || '',
			});
		} else {
			setFormData(initialFormData);
		}
	}, [editingUser]);

	const handleInputChange = (field: keyof FormData) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const isFormValid = () => {
		return formData.firstName.trim() && formData.lastName.trim() && formData.age.trim();
	};

	const hasFormData = () => {
		return formData.firstName || formData.lastName || formData.age;
	};

	const handleSubmit = () => {
		if (!isFormValid()) {
			alert('Please enter user details!');
			return;
		}

		const ageNumber = Number(formData.age);

		if (editingUser?.id) {
			updateUser(editingUser.id, formData.firstName, formData.lastName, ageNumber);
		} else {
			addUser(formData.firstName, formData.lastName, ageNumber);
		}

		setFormData(initialFormData);
	};

	const handleClear = () => {
		setFormData(initialFormData);
	};

	const isEditing = !!editingUser?.id;

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">
				📚 {isEditing ? 'Edit' : 'Add New'} User
			</h3>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						First Name
					</label>
					<InputText
						id="firstName"
						name="firstName"
						placeholder="First Name"
						initialValue={formData.firstName}
						onChange={handleInputChange('firstName')}
						hideWrapper
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Last Name
					</label>
					<InputText
						id="lastName"
						name="lastName"
						placeholder="Last Name"
						initialValue={formData.lastName}
						onChange={handleInputChange('lastName')}
						hideWrapper
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
					<InputText
						id="age"
						name="age"
						placeholder="Age"
						initialValue={formData.age}
						onChange={handleInputChange('age')}
						hideWrapper
					/>
				</div>

				{hasFormData() && (
					<Button
						primary
						negative
						onClick={handleClear}
						className="w-full text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
					>
						Clear
					</Button>
				)}

				<Button
					onClick={handleSubmit}
					primary
					positive
					className="w-full text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
				>
					➕ {isEditing ? 'Update' : 'Add'} User
				</Button>
			</div>
		</div>
	);
};
