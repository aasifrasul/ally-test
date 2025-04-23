import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { produce } from '../utils/immutable';
import { gql } from '@apollo/client';
import { client } from '../apolloClient';

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
	searchText: string;
	filteredBooks: Book[];
	loading: boolean;
	error: Error | null;
	fetchBooks: () => Promise<void>;
	addBook: AddBookType;
	editingBook: Book | null;
	editBook: (id: number) => void;
	issueBook: (id: number) => Promise<void>;
	returnBook: (id: number) => Promise<void>;
	deleteBook: (id: number) => Promise<void>;
	filterByText: (text: string) => void;
	updateBook: (book: UpdateBookType) => Promise<void>;
	reset: () => void;
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
			status
		}
	}
`;

const ADD_BOOK = gql`
	mutation AddBook($title: String!, $author: String!, $status: String!) {
		addBook(title: $title, author: $author, status: $status) {
			success
			message
			book {
				id
				title
				author
				status
			}
		}
	}
`;

const UPDATE_BOOK = gql`
	mutation UpdateBook($id: ID!, $title: String, $author: String, $status: String) {
		updateBook(id: $id, title: $title, author: $author, status: $status) {
			success
			message
			book {
				id
				title
				author
				status
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
			if (book.status === 'available') {
				counts.available += 1;
			} else {
				counts.issued += 1;
			}
			return counts;
		},
		{ available: 0, issued: 0 },
	);

const useBookStore = create<BookStoreState>()(
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
					set(
						produce((state: BookStoreState) => {
							state.loading = true;
							state.error = null;
						}),
					),
				setError: (error) =>
					set(
						produce((state: BookStoreState) => {
							state.error =
								error instanceof Error ? error : new Error(String(error));
							state.loading = false;
						}),
					),
				fetchBooks: async () => {
					get().setStatus();

					try {
						const { data } = await client.query({
							query: GET_BOOKS,
							fetchPolicy: 'network-only',
						});

						if (data && data.getBooks) {
							const counts = calculateCounts(data.getBooks);

							set(
								produce((state: BookStoreState) => {
									state.books = data.getBooks;
									state.filteredBooks = filterBooks(
										data.getBooks,
										state.searchText,
									);
									state.noOfAvailable = counts.available;
									state.noOfIssued = counts.issued;
									state.loading = false;
								}),
							);
						}
					} catch (error) {
						get().setError(error as Error);
					}
				},

				filterByText: (text) =>
					set(
						produce((state: BookStoreState) => {
							state.searchText = text;
							state.filteredBooks = filterBooks(state.books, text);
						}),
					),

				addBook: async (bookData) => {
					get().setStatus();

					try {
						const { data } = await client.mutate({
							mutation: ADD_BOOK,
							variables: {
								title: bookData.title,
								author: bookData.author,
								status: 'available',
							},
						});

						if (data!.addBook!.success) {
							const newBook = data.addBook.book;

							set(
								produce((state: BookStoreState) => {
									state.books.push(newBook);
									state.filteredBooks = filterBooks(
										state.books,
										state.searchText,
									);
									state.noOfAvailable += 1;
									state.loading = false;
								}),
							);
						}
					} catch (error) {
						get().setError(error as Error);
					}
				},

				editBook: (id) => {
					set(
						produce((state: BookStoreState) => {
							state.editingBook = get().books.find((b) => b.id === id) || null;
						}),
					);
				},

				updateBook: async (updateData) => {
					get().setStatus();

					try {
						const { data } = await client.mutate({
							mutation: UPDATE_BOOK,
							variables: {
								id: updateData.id.toString(),
								...(updateData.title && { title: updateData.title }),
								...(updateData.author && { author: updateData.author }),
								...(updateData.status && { status: updateData.status }),
							},
						});

						if (data!.updateBook!.success) {
							const updatedBook = data.updateBook.book;

							set(
								produce((state: BookStoreState) => {
									const bookIndex = state.books.findIndex(
										(b) => b.id === updatedBook.id,
									);
									if (bookIndex !== -1) {
										// If the status is changing, update counts
										if (
											state.books[bookIndex].status !==
											updatedBook.status
										) {
											if (updatedBook.status === 'available') {
												state.noOfAvailable += 1;
												state.noOfIssued -= 1;
											} else {
												state.noOfAvailable -= 1;
												state.noOfIssued += 1;
											}
										}

										state.books[bookIndex] = updatedBook;
										state.filteredBooks = filterBooks(
											state.books,
											state.searchText,
										);
									}
									state.loading = false;
								}),
							);
						}
					} catch (error) {
						get().setError(error as Error);
					}
				},

				issueBook: async (id) => {
					const book = get().books.find((b) => b.id === id);
					if (book?.status === 'available') {
						await get().updateBook({ id, status: 'issued' });
					}
				},

				returnBook: async (id) => {
					const book = get().books.find((b) => b.id === id);
					if (book?.status === 'issued') {
						await get().updateBook({ id, status: 'available' });
					}
				},

				deleteBook: async (id) => {
					get().setStatus();

					try {
						const { data } = await client.mutate({
							mutation: DELETE_BOOK,
							variables: {
								id: id.toString(),
							},
						});

						if (data && data.deleteBook) {
							set(
								produce((state: BookStoreState) => {
									const bookIndex = state.books.findIndex(
										(b) => b.id === id,
									);
									if (bookIndex !== -1) {
										const deletedBook = state.books[bookIndex];
										state.books.splice(bookIndex, 1);
										state.filteredBooks = filterBooks(
											state.books,
											state.searchText,
										);

										if (deletedBook.status === 'available') {
											state.noOfAvailable -= 1;
										} else {
											state.noOfIssued -= 1;
										}
									}
									state.loading = false;
								}),
							);
						}
					} catch (error) {
						get().setError(error as Error);
					}
				},

				reset: async () => {
					set(
						produce((state: BookStoreState) => {
							state.books = [];
							state.filteredBooks = [];
							state.searchText = '';
							state.noOfAvailable = 0;
							state.noOfIssued = 0;
							state.loading = false;
							state.error = null;
							state.editingBook = null;
						}),
					);
				},
			}),
		),
	),
);

export default useBookStore;
