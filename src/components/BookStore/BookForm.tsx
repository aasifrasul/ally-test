import { useState, useEffect } from 'react';

import { InputText } from '../Common/InputText';
import Separator from '../Common/Separator';
import Button from '../Common/Button';

import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

const BookForm = () => {
	const { books, updateBook, addBook, editingBook } = useBookStore();
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

		addBook({ title, author });
		resetForm();
	};

	const handleUpdateBook = () => {
		if (!title || !author) {
			return alert('Please enter book details!');
		}
		updateBook({ ...editingBook, title, author });
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
		<div className="input-div">
			<div className="input-grp">
				<InputText
					id="title"
					name="title"
					placeholder="Title"
					initialValue={title}
					hideWrapper
					onChange={handleOnChangeTitle}
				/>
				<Separator width="10px" inline />
				<InputText
					id="author"
					name="author"
					placeholder="Author"
					initialValue={author}
					hideWrapper
					onChange={handleOnChangeAuthor}
				/>
				<Separator width="10px" inline />
				<Button onClick={handleSubmit}>{addEditText} Book</Button>
			</div>
		</div>
	);
};

export default BookForm;
