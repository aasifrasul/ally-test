import { useState } from 'react';

import InputText from '../Common/InputText';
import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

function BookForm() {
	const addBook = useBookStore((state: BookStoreState) => state.addBook);
	const [bookDetails, setBookDetails] = useState<Book>({
		id: 0,
		title: '',
		author: '',
		status: 'available',
	});

	const handleOnChangeTitle = (value: string) => {
		setBookDetails({ ...bookDetails, title: value });
	};

	const handleOnChangeAuthor = (value: string) => {
		setBookDetails({ ...bookDetails, author: value });
	};

	const handleAddBook = () => {
		if (!bookDetails.title || !bookDetails.author) {
			return alert('Please enter book details!');
		}
		const maxId = useBookStore
			.getState()
			.books.reduce((max, { id }) => Math.max(id, max), 0);
		addBook({ ...bookDetails, id: maxId + 1 });
	};

	return (
		<div className="input-div">
			<div className="input-grp">
				<InputText
					id="title"
					name="title"
					placeholder="Title"
					hideWrapper
					onChange={handleOnChangeTitle}
				/>
				<InputText
					id="author"
					name="author"
					placeholder="Author"
					hideWrapper
					onChange={handleOnChangeAuthor}
				/>
				<button onClick={handleAddBook}>Add Book</button>
			</div>
		</div>
	);
}

export default BookForm;
