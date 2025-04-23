import { useEffect, useState } from 'react';

import ScrollToTop from '../Common/ScrollToTopButton';
import Separator from '../Common/Separator';

import BookForm from './BookForm';
import BookList from './BookList';
import { SearchBook } from './SearchBook';

import useBookStore, { Book, BookStoreState } from '../../store/bookStore';

import './App.css';

interface Props {}

const App: React.FC<Props> = () => {
	const { reset, fetchBooks } = useBookStore();

	useEffect(() => {
		fetchBooks();
		reset();
	}, [reset]);

	return (
		<div className="App">
			<h2>My Library Store</h2>
			<ScrollToTop />
			<BookForm />
			<Separator height={'20px'} />
			<SearchBook />
			<Separator height={'20px'} />
			<BookList />
		</div>
	);
};

export default App;
