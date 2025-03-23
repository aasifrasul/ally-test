import { useState, useEffect } from 'react';

import { InputText } from '../Common/InputText';
import Separator from '../Common/Separator';

import { Book, BookStoreState } from '../../store/bookStore';

interface Props extends BookStoreState {
	book: Book | null;
}

const BookForm: React.FC<Props> = ({ books, updateBook, addBook, book }) => {
	const [bookDetails, setBookDetails] = useState<Book>({
		id: 0,
		title: '',
		author: '',
		status: 'available',
	});

	useEffect(() => {
		if (book) {
			setBookDetails({ ...book });
		}
	}, [book]);

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
		const maxId = books.reduce((maxId, { id }) => (id > maxId ? id : maxId), 0);

		addBook({ ...bookDetails, id: maxId + 1 });
	};

	const handleUpdateBook = () => {
		if (!bookDetails.title || !bookDetails.author) {
			return alert('Please enter book details!');
		}
		updateBook({ ...bookDetails });
	};

	const handleSubmit = () => {
		book?.id ? handleUpdateBook() : handleAddBook();
		resetForm();
	};

	const resetForm = () => {
		setBookDetails({ id: 0, title: '', author: '', status: 'available' });
	};

	const addEditText = book?.id ? 'Edit' : 'Add';

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
