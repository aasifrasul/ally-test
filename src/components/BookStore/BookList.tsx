import useBookStore, { Book } from '../../store/bookStore';

import Separator from '../Common/Separator';
import Button from '../Common/Button';

const BookList = () => {
	const { books, editBook, noOfAvailable, noOfIssued, issueBook, returnBook, deleteBook } =
		useBookStore();

	const getBookById = (id: string, books: Book[]): Book | undefined =>
		books.find((book) => book.id === id);

	const handleDeleteBook = (id: string): void => {
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
			{books.map(({ id = '', status, title, author }: Book) => (
				<li key={id} className="book-item">
					<h3>{title}</h3>
					<p>{author}</p>
					<p>Status: {status}</p>
					{status === 'available' ? (
						<Button onClick={() => issueBook(id)}>Issue</Button>
					) : (
						<Button onClick={() => returnBook(id)}>Return</Button>
					)}
					<Separator width="10px" inline />
					<Button disabled={status === 'issued'} onClick={() => editBook(id)}>
						Edit
					</Button>
					<Separator width="10px" inline />
					<Button
						negative
						disabled={status === 'issued'}
						onClick={() => handleDeleteBook(id)}
					>
						Delete
					</Button>
				</li>
			))}
		</ul>
	);
};

export default BookList;
