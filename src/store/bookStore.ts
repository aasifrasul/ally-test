import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { gql } from '@apollo/client';
import { client } from '../ApolloClient';
import { handleAsyncCalls } from '../utils/AsyncUtil';

export interface Book {
	id?: string;
	title: string;
	author: string;
	issued: boolean;
}

export type AddBookType = (book: Book) => void;
export type UpdateBookType = Book;

export interface BookStoreState {
	books: Book[];
	noOfAvailable: number;
	noOfIssued: number;
	searchText: string;
	filteredBooks: Book[];
	loading: boolean;
	error: Error | null;
	fetchBooks: () => Promise<void>;
	addBook: AddBookType;
	editingBook: Book | null;
	editBook: (id: string) => void;
	issueBook: (id: string) => Promise<void>;
	returnBook: (id: string) => Promise<void>;
	deleteBook: (id: string) => Promise<void>;
	filterByText: (text: string) => void;
	updateBook: (book: UpdateBookType) => Promise<void>;
	reset: () => void;
	resetEditingBook: () => void;
	setStatus: () => void;
	setError: (error: Error | string) => void;
}

// GraphQL Queries and Mutations
const GET_BOOKS = gql`
	query GetBooks {
		getBooks {
			id
			title
			author
			issued
		}
	}
`;

const ADD_BOOK = gql`
	mutation AddBook($title: String!, $author: String!, $issued: Boolean!) {
		addBook(title: $title, author: $author, issued: $issued) {
			success
			message
			book {
				id
				title
				author
				issued
			}
		}
	}
`;

const UPDATE_BOOK = gql`
	mutation UpdateBook($id: ID!, $title: String, $author: String, $issued: Boolean) {
		updateBook(id: $id, title: $title, author: $author, issued: $issued) {
			success
			message
			book {
				id
				title
				author
				issued
			}
		}
	}
`;

const DELETE_BOOK = gql`
	mutation DeleteBook($id: ID!) {
		deleteBook(id: $id) {
			id
		}
	}
`;

const filterBooks = (books: Book[], text: string): Book[] => {
	if (text.length <= 0) return books;
	const textLowercased = text.toLowerCase();
	return books.filter(
		({ title, author }) =>
			title.toLowerCase().includes(textLowercased) ||
			author.toLowerCase().includes(textLowercased),
	);
};

const calculateCounts = (books: Book[]) =>
	books.reduce(
		(counts, book) => {
			if (book.issued) {
				counts.issued += 1;
			} else {
				counts.available += 1;
			}
			return counts;
		},
		{ available: 0, issued: 0 },
	);

export const useBookStore = create<BookStoreState>()(
	devtools(
		immer(
			(set, get): BookStoreState => ({
				books: [],
				filteredBooks: [],
				searchText: '',
				noOfAvailable: 0,
				noOfIssued: 0,
				loading: false,
				error: null,
				editingBook: null,

				setStatus: () =>
					set((state) => {
						state.loading = true;
						state.error = null;
					}),

				setError: (error) =>
					set((state) => {
						state.error =
							error instanceof Error ? error : new Error(String(error));
						state.loading = false;
					}),

				fetchBooks: async () => {
					get().setStatus();

					const result = await handleAsyncCalls(() =>
						client.query({
							query: GET_BOOKS,
							fetchPolicy: 'network-only',
						}),
					);

					if (!result.success) {
						get().setError(result.error as Error);
						return;
					}

					const data = result?.data?.data?.getBooks;
					if (!data.length) return;

					const counts = calculateCounts(data);

					set((state) => {
						state.books = data;
						state.filteredBooks = filterBooks(data, state.searchText);
						state.noOfAvailable = counts.available;
						state.noOfIssued = counts.issued;
						state.loading = false;
					});
				},

				filterByText: (text) =>
					set((state) => {
						state.searchText = text;
						state.filteredBooks = filterBooks(state.books, text);
					}),

				addBook: async (bookData) => {
					get().setStatus();

					const result = await handleAsyncCalls(() =>
						client.mutate({
							mutation: ADD_BOOK,
							variables: { ...bookData, issued: false },
						}),
					);

					if (!result.success) {
						get().setError(result.error as Error);
						return;
					}

					if (!result?.data?.data?.addBook?.success) return;
					const newBook = result?.data?.data.addBook.book;

					set((state) => {
						state.books.push(newBook);
						state.filteredBooks = filterBooks(state.books, state.searchText);
						state.noOfAvailable += 1;
						state.loading = false;
					});
				},

				editBook: (id: string | null) => {
					set((state) => {
						state.editingBook = get().books.find((b) => b.id === id) || null;
					});
				},

				updateBook: async (updateData): Promise<void> => {
					get().setStatus();

					const { id, title, author, issued } = updateData;
					const result = await handleAsyncCalls(() =>
						client.mutate({
							mutation: UPDATE_BOOK,
							variables: {
								id: id,
								...(title && { title }),
								...(author && { author }),
								...(issued && { issued }),
							},
						}),
					);

					if (!result.success) {
						get().setError(result.error as Error);
						return;
					}

					if (!result?.data?.data!.updateBook!.success) return;
					const updatedBook = result?.data?.data.updateBook.book;

					set((state) => {
						state.editingBook = null;
						const bookIndex = state.books.findIndex(
							(b) => b.id === updatedBook.id,
						);
						if (bookIndex !== -1) {
							// If the issued is changing, update counts
							if (state.books[bookIndex].issued !== updatedBook.issued) {
								if (updatedBook.issued) {
									state.noOfAvailable -= 1;
									state.noOfIssued += 1;
								} else {
									state.noOfAvailable += 1;
									state.noOfIssued -= 1;
								}
							}

							state.books[bookIndex] = updatedBook;
							state.filteredBooks = filterBooks(state.books, state.searchText);
						}
						state.loading = false;
					});
				},

				issueBook: async (id) => {
					const book = get().books.find((b) => b.id === id);
					if (book && !book.issued) {
						await get().updateBook({ ...book, id, issued: true });
					}
				},

				returnBook: async (id) => {
					const book = get().books.find((b) => b.id === id);
					if (book?.issued) {
						await get().updateBook({ ...book, id, issued: false });
					}
				},

				deleteBook: async (id): Promise<void> => {
					get().setStatus();

					const result = await handleAsyncCalls(() =>
						client.mutate({
							mutation: DELETE_BOOK,
							variables: {
								id,
							},
						}),
					);

					if (!result.success) {
						get().setError(result.error as Error);
						return;
					}

					if (!result?.data?.data?.deleteBook) return;

					set((state) => {
						const bookIndex = state.books.findIndex((b) => b.id === id);
						if (bookIndex !== -1) {
							const deletedBook = state.books[bookIndex];
							state.books.splice(bookIndex, 1);
							state.filteredBooks = filterBooks(state.books, state.searchText);

							if (deletedBook.issued) {
								state.noOfIssued -= 1;
							} else {
								state.noOfAvailable -= 1;
							}
						}
						state.loading = false;
					});
				},

				resetEditingBook: async () => {
					set((state) => {
						state.editingBook = null;
					});
				},

				reset: async () => {
					set((state) => {
						state.books = [];
						state.filteredBooks = [];
						state.searchText = '';
						state.noOfAvailable = 0;
						state.noOfIssued = 0;
						state.loading = false;
						state.error = null;
						state.editingBook = null;
					});
				},
			}),
		),
	),
);
