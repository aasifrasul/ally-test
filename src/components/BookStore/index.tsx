import { useEffect, useState } from 'react';

import ScrollToTop from '../Common/ScrollToTopButton';
import Separator from '../Common/Separator';

import BookForm from './BookForm';
import BookList from './BookList';
import { SearchBook } from './SeachBook';

import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

import './App.css';

interface Props {}

const App: React.FC<Props> = () => {
	const bookStoreState = useBookStore();
	const { reset, filterByText, filterText, books, filteredBooks } = bookStoreState;
	const [book, setBook] = useState<Book | null>(null);

	useEffect(() => {
		bookStoreState.fetchBooks();
		reset();
	}, [reset]);

	const handleChange = (text: string) => {
		filterByText(text);
	};

	const handleEditBook = (book: Book) => {
		setBook({ ...book });
	};

	const bookStoreData: BookStoreState = {
		...bookStoreState,
		books: filterText ? [...filteredBooks] : [...books],
	};

	return (
		<div className="App">
			<h2>My Library Store</h2>
			<ScrollToTop />
			<BookForm {...bookStoreData} book={book} />
			<Separator height={'20px'} />
			<SearchBook onChange={handleChange} />
			<Separator height={'20px'} />
			<BookList {...bookStoreData} onEditBook={handleEditBook} />
		</div>
	);
};

export default App;
