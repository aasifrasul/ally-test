import { useEffect } from 'react';
import BookForm from './BookForm';
import BookList from './BookList';
import useBookStore, { BookStoreState } from '../../store/bookStore';
import './App.css';

function App(): JSX.Element {
	const reset = useBookStore((state: BookStoreState) => state.reset);

	useEffect(() => {
		reset();
	}, [reset]);

	return (
		<div className="App">
			<h2>My Library Store</h2>
			<BookForm />
			<BookList />
		</div>
	);
}

export default App;
