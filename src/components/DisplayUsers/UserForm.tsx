import { useState, useEffect, useRef } from 'react';

import { InputText } from '../Common/InputText';
import Button from '../Common/Button';
import { User, AddUser, UpdateUser } from './types';

interface UserFormProps {
	editingUser: User | null;
	handleAddUser: AddUser;
	handleUpdateUser: UpdateUser;
}

interface FormData {
	name: string;
	email: string;
	age?: string;
}

const initialFormData: FormData = {
	name: '',
	email: '',
	age: '',
};

export const UserForm = ({ editingUser, handleAddUser, handleUpdateUser }: UserFormProps) => {
	const [formData, setFormData] = useState<FormData>(initialFormData);
	const nameRef = useRef<HTMLInputElement | null>(null);

	// Update form when editingUser changes
	useEffect(() => {
		if (editingUser) {
			setFormData({
				name: editingUser.name || '',
				email: editingUser.email || '',
				age: editingUser.age?.toString() || '',
			});
			nameRef.current?.focus();
		} else {
			setFormData(initialFormData);
		}
	}, [editingUser]);

	useEffect(() => {
		nameRef.current?.focus();
	}, []);

	const handleInputChange = (field: keyof FormData) => (value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const isFormValid = () => {
		return formData.name.trim() && formData.email.trim();
	};

	const hasFormData = () => {
		return formData.name || formData.email || formData.age;
	};

	const handleSubmit = () => {
		if (!isFormValid()) {
			alert('Please enter user details!');
			return;
		}

		const { name, email, age } = formData;
		const ageNumber = Number(age);

		if (editingUser?.id) {
			handleUpdateUser(editingUser.id, name, email, ageNumber);
		} else {
			handleAddUser(name, email, ageNumber);
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
						Name
					</label>
					<InputText
						ref={nameRef}
						id="name"
						name="name"
						placeholder="Name"
						initialValue={formData.name}
						onChange={handleInputChange('name')}
						hideWrapper
						clearable
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<InputText
						id="email"
						name="email"
						placeholder="Email"
						initialValue={formData.email}
						onChange={handleInputChange('email')}
						hideWrapper
						clearable
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
						clearable
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
