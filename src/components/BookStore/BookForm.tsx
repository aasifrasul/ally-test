import { useState } from 'react';

import { InputText } from '../Common/InputText';
import Separator from '../Common/Separator';

import useBookStore, { Book, BookStoreState, type AddBookType } from '../../store/bookStore';

function BookForm() {
	const [bookDetails, setBookDetails] = useState<Book>({
		id: 0,
		title: '',
		author: '',
		status: 'available',
	});

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
		const { books, addBook }: BookStoreState = useBookStore.getState();
		const maxId = books.reduce((max, { id }) => Math.max(id, max), 0);
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
				<Separator width="10px" inline />
				<InputText
					id="author"
					name="author"
					placeholder="Author"
					hideWrapper
					onChange={handleOnChangeAuthor}
				/>
				<Separator width="10px" inline />
				<button onClick={handleAddBook}>Add Book</button>
			</div>
		</div>
	);
}

export default BookForm;
