import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
//import { produce } from 'immer';
import { produce } from '../utils/immutable';

export interface Book {
	id: number;
	title: string;
	author: string;
	status: 'available' | 'issued';
}

export type AddBookType = (book: Omit<Book, 'status'>) => void;
export type UpdateBookType = Partial<Book> & { id: number };

export interface BookStoreState {
	books: Book[];
	noOfAvailable: number;
	noOfIssued: number;
	filterText: string;
	filteredBooks: Book[];
	addBook: AddBookType;
	issueBook: (id: number) => void;
	returnBook: (id: number) => void;
	deleteBook: (id: number) => void;
	filterByText: (text: string) => void;
	updateBook: (book: UpdateBookType) => void;
	reset: () => void;
}

const filterBooks = (books: Book[], text: string): Book[] => {
	if (text.length <= 0) return books;
	const textLowercased = text.toLowerCase();
	return books.filter(
		({ title, author }) =>
			title.toLowerCase().includes(textLowercased) ||
			author.toLowerCase().includes(textLowercased),
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
						produce((state: BookStoreState) => {
							state.filterText = text;
							state.filteredBooks = filterBooks(state.books, text);
						}),
					),
				addBook: (bookData) =>
					set(
						produce((state: BookStoreState) => {
							const newBook: Book = {
								...bookData,
								status: 'available',
								id:
									state.books.length > 0
										? Math.max(...state.books.map((b) => b.id)) + 1
										: 1,
							};
							state.books.push(newBook);
							state.filteredBooks = filterBooks(state.books, state.filterText);
							state.noOfAvailable += 1;
						}),
					),
				updateBook: (updateData) =>
					set(
						produce((state: BookStoreState) => {
							const bookIndex = state.books.findIndex(
								(b) => b.id === updateData.id,
							);
							if (bookIndex !== -1) {
								state.books[bookIndex] = {
									...state.books[bookIndex],
									...updateData,
								};
								state.filteredBooks = filterBooks(
									state.books,
									state.filterText,
								);
							}
						}),
					),
				issueBook: (id) =>
					set(
						produce((state: BookStoreState) => {
							const book = state.books.find((b) => b.id === id);
							if (book?.status === 'available') {
								book.status = 'issued';
								state.noOfAvailable -= 1;
								state.noOfIssued += 1;
								state.filteredBooks = filterBooks(
									state.books,
									state.filterText,
								);
							}
						}),
					),
				returnBook: (id) =>
					set(
						produce((state: BookStoreState) => {
							const book = state.books.find((b) => b.id === id);
							if (book?.status === 'issued') {
								book.status = 'available';
								state.noOfAvailable += 1;
								state.noOfIssued -= 1;
								state.filteredBooks = filterBooks(
									state.books,
									state.filterText,
								);
							}
						}),
					),
				deleteBook: (id) =>
					set(
						produce((state: BookStoreState) => {
							const bookIndex = state.books.findIndex((b) => b.id === id);
							if (bookIndex !== -1) {
								const deletedBook = state.books[bookIndex];
								state.books.splice(bookIndex, 1);
								state.filteredBooks = filterBooks(
									state.books,
									state.filterText,
								);
								if (deletedBook.status === 'available') {
									state.noOfAvailable -= 1;
								} else {
									state.noOfIssued -= 1;
								}
							}
						}),
					),
				reset: () =>
					set(
						produce((state: BookStoreState) => {
							state.books = [];
							state.filteredBooks = [];
							state.filterText = '';
							state.noOfAvailable = 0;
							state.noOfIssued = 0;
						}),
					),
			}),
		),
	),
);

export default useBookStore;
