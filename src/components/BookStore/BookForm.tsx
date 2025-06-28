import { useState, useEffect } from 'react';

import { InputText } from '../Common/InputText';

import useBookStore from '../../store/bookStore';

const BookForm = () => {
	const { updateBook, addBook, editingBook } = useBookStore();
	const [title, setTitle] = useState<string>('');
	const [author, setAuthor] = useState<string>('');

	useEffect(() => {
		if (editingBook) {
			setTitle(editingBook.title);
			setAuthor(editingBook.author);
		} else {
			resetForm();
		}
	}, [editingBook]);

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

	const addEditText = editingBook?.id ? 'Edit' : 'Add';

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
			<h3 className="text-lg font-semibold text-gray-800 mb-4">📚 Add New Book</h3>
			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Title
					</label>
					<InputText
						id="title"
						name="title"
						placeholder="Title"
						initialValue={title}
						hideWrapper
						onChange={handleOnChangeTitle}
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Author
					</label>
					<InputText
						id="author"
						name="author"
						placeholder="Author"
						initialValue={author}
						hideWrapper
						onChange={handleOnChangeAuthor}
					/>
				</div>
				<button
					onClick={handleSubmit}
					className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
				>
					➕ {addEditText} Book
				</button>
			</div>
		</div>
	);
};

export default BookForm;
