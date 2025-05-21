import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

import Separator from '../Common/Separator';

const BookList = () => {
	const { books, noOfAvailable, noOfIssued, issueBook, returnBook, deleteBook, updateBook } =
		useBookStore();

	const getBookById = (id: number, books: Book[]): Book | undefined =>
		books.find((book) => book.id === id);

	const handleEditBook = (id: number) => {
		const book = getBookById(id, books);

		if (!book) {
			alert(`Cannot find book with id:${id}.`);
			return;
		}

		if (book.status === 'issued') {
			alert('Book is issued. Cannot be Edited.');
			return;
		}

		updateBook(book);
	};

	const handleDeleteBook = (id: number): void => {
		const book = getBookById(id, books);

		if (!book) {
			return;
		}

		if (book.status === 'issued') {
			alert('Book is issued. Cannot be Deleted.');
			return;
		}

		deleteBook(id);
	};

	return (
		<ul className="book-list">
			{books.length > 0 && (
				<span className="books-count">
					<h4>Available: {noOfAvailable}</h4>
					<h4>Issued: {noOfIssued}</h4>
				</span>
			)}
			{books.map(({ id, status, title, author }: Book) => (
				<li key={id} className="book-item">
					<h3>{title}</h3>
					<p>{author}</p>
					<p>Status: {status}</p>
					{status === 'available' ? (
						<button onClick={() => issueBook(id)}>Issue</button>
					) : (
						<button onClick={() => returnBook(id)}>Return</button>
					)}
					<Separator width="10px" inline />
					<button disabled={status === 'issued'} onClick={() => handleEditBook(id)}>
						Edit
					</button>
					<Separator width="10px" inline />
					<button
						disabled={status === 'issued'}
						onClick={() => handleDeleteBook(id)}
					>
						Delete
					</button>
				</li>
			))}
		</ul>
	);
};

export default BookList;
