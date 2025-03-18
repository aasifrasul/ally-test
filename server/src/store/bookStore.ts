import { constants } from '../constants';
import { logger } from '../Logger';
import { DBType } from '../types';
import { Book, IBook, IBookDocument } from '../models';

const { currentDB } = constants.dbLayer;

// Get all books
export async function getBooks() {
	if (currentDB === DBType.MONGODB) {
		try {
			const books = await Book.find({});
			return books;
		} catch (error) {
			logger.error(`Failed to fetch books in MongoDB: ${error}`);
			return [];
		}
	}
}

// Get a specific book by id
export async function getBook(id: string): Promise<IBookDocument | null> {
	const bookId = parseInt(id, 10);
	if (currentDB === DBType.MONGODB) {
		try {
			const book: IBookDocument | null = await Book.findById(id);
			// redisClient.cacheData(id, book);
			return book;
		} catch (error) {
			logger.error(`Failed to create book in MongoDB: ${error}`);
			return null;
		}
	}
	return null;
}

// Add a new book
export function addBook(book) {
	const newBook = {
		...book,
		id: nextId++,
	};
	books.push(newBook);
	return newBook;
}

// Update an existing book
export function updateBook(id, updatedBook) {
	const bookId = parseInt(id, 10);
	const index = books.findIndex((book) => book.id === bookId);
	if (index === -1) {
		throw new Error(`Book with id ${id} not found`);
	}
	books[index] = { ...updatedBook, id: bookId };
	return books[index];
}

// Delete a book
export function deleteBook(id) {
	const bookId = parseInt(id, 10);
	const initialLength = books.length;
	books = books.filter((book) => book.id !== bookId);

	if (books.length === initialLength) {
		throw new Error(`Book with id ${id} not found`);
	}
	return true;
}
