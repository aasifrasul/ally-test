import { useState, useEffect, useRef } from 'react';

import { InputText } from '../Common/InputText';
import Button from '../Common/Button';

import { useBookStore } from '../../store/bookStore';

const BookForm = () => {
	const { updateBook, addBook, editingBook, resetEditingBook } = useBookStore();
	const [title, setTitle] = useState<string>('');
	const [author, setAuthor] = useState<string>('');

	const titleRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (editingBook) {
			setTitle(editingBook.title);
			setAuthor(editingBook.author);
			titleRef.current?.focus();
		} else {
			resetForm();
		}
	}, [editingBook]);

	useEffect(() => {
		titleRef.current?.focus();
	}, []);

	const handleOnChangeTitle = (value: string): void => {
		setTitle(value);
	};

	const handleOnChangeAuthor = (value: string): void => {
		setAuthor(value);
	};

	const handleAddBook = (): void => {
		if (!title || !author) {
			return alert('Please enter book details!');
		}

		addBook({ title, author, issued: false });
		resetForm();
	};

	const handleUpdateBook = () => {
		if (!title || !author) {
			return alert('Please enter book details!');
		}
		updateBook({ ...editingBook, title, author, issued: editingBook!.issued });
		resetForm();
	};

	const handleSubmit = () => {
		editingBook?.id ? handleUpdateBook() : handleAddBook();
		resetForm();
	};

	const resetForm = () => {
		setTitle('');
		setAuthor('');
	};

	const handleClear = () => {
		resetForm();
		resetEditingBook();
	};

	const addEditText = editingBook?.id ? 'Edit' : 'Add';

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Add New Book</h3>
			<div className="space-y-4">
				<div>
					<InputText
						ref={titleRef}
						label="Title"
						id="title"
						name="title"
						placeholder="Title"
						initialValue={title}
						hideWrapper
						onChange={handleOnChangeTitle}
					/>
				</div>
				<div>
					<InputText
						id="author"
						name="author"
						label="Author"
						placeholder="Author"
						initialValue={author}
						hideWrapper
						onChange={handleOnChangeAuthor}
					/>
				</div>
				{title || author ? (
					<Button
						primary
						negative
						onClick={handleClear}
						className="w-full text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
					>
						Clear
					</Button>
				) : null}
				<Button
					onClick={handleSubmit}
					primary
					positive
					className="w-full text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
				>
					➕ {addEditText} Book
				</Button>
			</div>
		</div>
	);
};

export default BookForm;
