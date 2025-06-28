import useBookStore, { Book } from '../../store/bookStore';

import Button from '../Common/Button';

export const BookCard = ({ book }: { book: Book }) => {
	const { editBook, issueBook, returnBook, deleteBook } = useBookStore();

	const handleDeleteBook = (): void => {
		if (book.issued) {
			alert('Book is issued. Cannot be Deleted.');
			return;
		}

		deleteBook(book?.id!);
	};

	const handleIssueBook = () => {
		const id = book?.id!;
		book.issued ? returnBook(id) : issueBook(id);
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
			<div className="flex justify-between items-start mb-4">
				<div className="flex-1">
					<h4 className="text-lg font-semibold text-gray-800 mb-1">{book.title}</h4>
					<p className="text-gray-600 mb-2">by {book.author}</p>
					<span
						className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
							book.issued
								? 'bg-green-100 text-green-800'
								: 'bg-yellow-100 text-yellow-800'
						}`}
					>
						{book.issued ? '✅' : '📤'} {book.issued}
					</span>
				</div>
			</div>

			<div className="flex gap-2">
				<Button
					onClick={handleIssueBook}
					className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-md transition-colors duration-200 text-sm"
				>
					{book.issued ? 'Return' : 'Issue'}
				</Button>
				<Button
					onClick={() => editBook(book.id!)}
					className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md transition-colors duration-200"
					title="Edit"
					disabled={book.issued}
				>
					✏️
				</Button>
				<Button
					onClick={handleDeleteBook}
					className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md transition-colors duration-200"
					title="Delete"
					disabled={book.issued}
				>
					🗑️
				</Button>
			</div>
		</div>
	);
};
