import { useBookStore } from '../../store/bookStore';

import { BookCard } from './BookCard';

const BookList = () => {
	const { filteredBooks, noOfAvailable, noOfIssued } = useBookStore();

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
								📚
							</div>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-green-900">
								Available Books
							</p>
							<p className="text-2xl font-bold text-green-700">
								{noOfAvailable}
							</p>
						</div>
					</div>
				</div>

				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
					<div className="flex items-center">
						<div className="flex-shrink-0">
							<div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
								📤
							</div>
						</div>
						<div className="ml-4">
							<p className="text-sm font-medium text-yellow-900">Issued Books</p>
							<p className="text-2xl font-bold text-yellow-700">{noOfIssued}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Books Grid */}
			<div>
				<h3 className="text-lg font-semibold text-gray-800 mb-4">Book Collection</h3>
				{filteredBooks.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredBooks.map((book) => (
							<BookCard key={book.id} book={book} />
						))}
					</div>
				) : (
					<div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
						<div className="text-4xl mb-4">📚</div>
						<p className="text-gray-500 text-lg">No books found</p>
						<p className="text-gray-400 text-sm">
							Add your first book to get started
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default BookList;
