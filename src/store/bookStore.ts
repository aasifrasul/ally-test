import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Book {
	id: number;
	title: string;
	author: string;
	status: 'available' | 'issued';
}

export type AddBookType = (book: Book) => void;
export type UpdateBookType = (book: Book) => void;
export type BookFunctionType = (id: number) => void;
export type FilterTextType = (text: string) => void;

export interface BookStoreState {
	books: Book[];
	noOfAvailable: number;
	noOfIssued: number;
	filterText: string;
	filteredBooks: Book[];
	addBook: AddBookType;
	issueBook: BookFunctionType;
	returnBook: BookFunctionType;
	deleteBook: BookFunctionType;
	filterByText: FilterTextType;
	updateBook: UpdateBookType;
	reset: () => void;
}

const filterBooks = (books: Book[], text: string): Book[] => {
	if (!text) return books;
	const lowerText = text.toLowerCase();
	return books.filter(
		(book) =>
			book.title.toLowerCase().includes(lowerText) ||
			book.author.toLowerCase().includes(lowerText),
	);
};

const useBookStore = create<BookStoreState>()(
	devtools(
		immer(
			(set): BookStoreState => ({
				books: [],
				filteredBooks: [],
				filterText: '',
				noOfAvailable: 0,
				noOfIssued: 0,
				filterByText: (text) =>
					set(
						(state: BookStoreState): BookStoreState => ({
							...state,
							filterText: text,
							filteredBooks: filterBooks(state.books, text),
						}),
					),
				addBook: (book) =>
					set((state: BookStoreState): BookStoreState => {
						const newBook: Book = { ...book, status: 'available' };
						const updatedBooks: Book[] = [...state.books, newBook];
						return {
							...state,
							books: updatedBooks,
							filteredBooks: filterBooks(updatedBooks, state.filterText),
							noOfAvailable: state.noOfAvailable + 1,
						};
					}),
				updateBook: (updatedBook) =>
					set((state: BookStoreState): BookStoreState => {
						const oldBook = state.books.find(({ id }) => updatedBook.id === id);
						const updatedBooks = state.books.map((book) => {
							if (updatedBook.id === book.id) {
								return {
									...oldBook,
									...updatedBook,
								};
							}
							return book;
						});

						return {
							...state,
							books: updatedBooks,
							filteredBooks: filterBooks(updatedBooks, state.filterText),
						};
					}),
				issueBook: (id) =>
					set((state: BookStoreState): BookStoreState => {
						const updatedBooks = state.books.map((book) =>
							book.id === id ? { ...book, status: 'issued' as 'issued' } : book,
						);
						return {
							...state,
							books: updatedBooks,
							filteredBooks: filterBooks(updatedBooks, state.filterText),
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
							filteredBooks: filterBooks(updatedBooks, state.filterText),
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
							filteredBooks: filterBooks(updatedBooks, state.filterText),
							noOfAvailable: state.noOfAvailable - 1,
						};
					}),
				reset: () =>
					set(
						(state: BookStoreState): BookStoreState => ({
							...state,
							books: [],
							filteredBooks: [],
							filterText: '',
							noOfAvailable: 0,
							noOfIssued: 0,
						}),
					),
			}),
		),
	),
);

export default useBookStore;
