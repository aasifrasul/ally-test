import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Book {
	id: number;
	title: string;
	author: string;
	status: 'available' | 'issued';
}

export interface BookStoreState {
	books: Book[];
	noOfAvailable: number;
	noOfIssued: number;
	addBook: (book: Omit<Book, 'status'>) => void;
	issueBook: (id: number) => void;
	returnBook: (id: number) => void;
	deleteBook: (id: number) => void;
	reset: () => void;
}

const useBookStore = create<BookStoreState>()(
	devtools(
		(set): BookStoreState => ({
			books: [],
			noOfAvailable: 0,
			noOfIssued: 0,
			addBook: (book) =>
				set(
					(state: BookStoreState): BookStoreState => ({
						...state,
						books: [...state.books, { ...book, status: 'available' } as Book],
						noOfAvailable: state.noOfAvailable + 1,
					}),
				),
			issueBook: (id) =>
				set((state: BookStoreState): BookStoreState => {
					const updatedBooks = state.books.map((book) =>
						book.id === id ? { ...book, status: 'issued' as 'issued' } : book,
					);
					return {
						...state,
						books: updatedBooks,
						noOfAvailable: state.noOfAvailable - 1,
						noOfIssued: state.noOfIssued + 1,
					};
				}),
			returnBook: (id) =>
				set((state: BookStoreState): BookStoreState => {
					const updatedBooks = state.books.map((book) =>
						book.id === id
							? { ...book, status: 'available' as 'available' }
							: book,
					);
					return {
						...state,
						books: updatedBooks,
						noOfAvailable: state.noOfAvailable + 1,
						noOfIssued: state.noOfIssued - 1,
					};
				}),
			deleteBook: (id) =>
				set((state: BookStoreState): BookStoreState => {
					const updatedBooks = state.books.filter((book) => book.id !== id);
					return {
						...state,
						books: updatedBooks,
						noOfAvailable: state.noOfAvailable - 1,
					};
				}),
			reset: () =>
				set(
					(state: BookStoreState): BookStoreState => ({
						...state,
						books: [],
						noOfAvailable: 0,
						noOfIssued: 0,
					}),
				),
		}),
	),
);

export default useBookStore;
