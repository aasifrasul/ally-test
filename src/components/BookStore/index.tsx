import { useEffect } from 'react';

import ScrollToTop from '../Common/ScrollToTopButton';

import BookForm from './BookForm';
import BookList from './BookList';
import { SearchBook } from './SearchBook';

import useBookStore from '../../store/bookStore';

import './App.css';

const App = () => {
	const { reset, fetchBooks } = useBookStore();

	useEffect(() => {
		fetchBooks();
		return () => reset();
	}, [reset]);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						📚 My Library Store
					</h1>
					<p className="text-gray-600">Manage your book collection with ease</p>
				</div>

				{/* Main Content */}
				<div className="space-y-8">
					<BookForm />
					<SearchBook />
					<BookList />
				</div>

				<ScrollToTop />
			</div>
		</div>
	);
};

export default App;
