import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

function BookList() {
	const {
		books,
		noOfAvailable,
		noOfIssued,
		issueBook,
		returnBook,
		deleteBook,
	}: BookStoreState = useBookStore();

	const handleDeleteBook = (id: number): void => {
		const book: Book | undefined = books.find((book) => book.id === id);

		if (!book) {
			return;
		}

		if (book.status === 'available') {
			deleteBook(id);
		} else {
			alert('Book is issued. Cannot be Deleted.');
		}
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
}

export default BookList;
