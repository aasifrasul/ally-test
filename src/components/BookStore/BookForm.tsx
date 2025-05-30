import { useState, useEffect } from 'react';

import { InputText } from '../Common/InputText';
import Separator from '../Common/Separator';

import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

const BookForm = () => {
	const { books, updateBook, addBook, editingBook } = useBookStore();
	const [bookDetails, setBookDetails] = useState<Book>({
		id: 0,
		title: '',
		author: '',
		status: 'available',
	});

	useEffect(() => {
		if (editingBook) {
			setBookDetails({ ...editingBook });
		}
	}, [editingBook]);

	const handleOnChangeTitle = (value: string): void => {
		setBookDetails({ ...bookDetails, title: value });
	};

	const handleOnChangeAuthor = (value: string): void => {
		setBookDetails({ ...bookDetails, author: value });
	};

	const handleAddBook = (): void => {
		if (!bookDetails.title || !bookDetails.author) {
			return alert('Please enter book details!');
		}

		addBook({ ...bookDetails });
	};

	const handleUpdateBook = () => {
		if (!bookDetails.title || !bookDetails.author) {
			return alert('Please enter book details!');
		}
		updateBook({ ...bookDetails });
	};

	const handleSubmit = () => {
		editingBook?.id ? handleUpdateBook() : handleAddBook();
		resetForm();
	};

	const resetForm = () => {
		setBookDetails({ id: 0, title: '', author: '', status: 'available' });
	};

	const addEditText = editingBook?.id ? 'Edit' : 'Add';

	return (
		<div className="input-div">
			<div className="input-grp">
				<InputText
					id="title"
					name="title"
					placeholder="Title"
					initialValue={bookDetails?.title}
					hideWrapper
					onChange={handleOnChangeTitle}
				/>
				<Separator width="10px" inline />
				<InputText
					id="author"
					name="author"
					placeholder="Author"
					initialValue={bookDetails?.author}
					hideWrapper
					onChange={handleOnChangeAuthor}
				/>
				<Separator width="10px" inline />
				<button onClick={handleSubmit}>{addEditText} Book</button>
			</div>
		</div>
	);
};

export default BookForm;
