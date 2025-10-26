import { PubSub } from 'graphql-subscriptions';
import { DBType } from '../types';
import { Book, IBook, BookArgs, BookMutationResponse, UpdatebookArgs } from '../models';
import { RedisClient } from '../cachingClients/redis';
import { getLimitCond, executeQuery } from '../dbClients/helper';
import { constants } from '../constants';
import { logger } from '../Logger';

const { currentDB } = constants.dbLayer;

const pubsub = new PubSub();

const redisClient = RedisClient.getInstance();
const table = 'book_store';

const getBook = async (parent: any, args: { id: string }): Promise<IBook | null> => {
	const { id } = args;

	let result = await redisClient.get(id);

	if (result) {
		return result as IBook;
	}

	if (currentDB === DBType.MONGODB) {
		try {
			const book = await Book.findById(id);
			if (book) {
				await redisClient.set(id, book);
			}
			return book;
		} catch (error) {
			logger.error(`Failed to fetch book from MongoDB: ${error}`);
			return null;
		}
	} else {
		const whereClause = id ? `WHERE id = $1` : getLimitCond(currentDB, 1);
		const query = `SELECT id, title, author, issued FROM ${table} ${whereClause}`;

		try {
			const rows = await executeQuery<any>(query, [id]);
			return rows[0] || null;
		} catch (err) {
			logger.error(`Failed to fetch book: ${query} - ${err}`);
			return null;
		}
	}
};

const getBooks = async (parent: any, args: BookArgs = {}): Promise<IBook[]> => {
	const keys = Object.keys(args);

	if (currentDB === DBType.MONGODB) {
		try {
			const params = keys.reduce((acc: Record<string, { $regex: RegExp }>, key) => {
				acc[key] = { $regex: new RegExp(`\\d*${args[key as keyof BookArgs]}\\d*`) };
				return acc;
			}, {});

			return await Book.find(params);
		} catch (error) {
			logger.error(`Failed to fetch books from MongoDB: ${error}`);
			return [];
		}
	} else {
		let whereClause = getLimitCond(currentDB, 10);
		if (keys.length) {
			whereClause =
				'WHERE ' +
				keys.map((key) => `"${key}" = '${args[key as keyof BookArgs]}'`).join(' AND ');
		}
		const query: string = `SELECT id, title, author, issued FROM ${table} ${whereClause}`;
		try {
			const result: IBook[] = await executeQuery(query);
			return result;
		} catch (error) {
			logger.error(`Failed to fetch books: ${query} - ${error}`);
			return [];
		}
	}
};

const addBook = async (parent: any, args: IBook): Promise<BookMutationResponse> => {
	const { title, author, issued = false } = args;
	// Validation
	if (!title || !author) {
		throw new Error('Title, author and issued are required');
	}

	if (currentDB === DBType.MONGODB) {
		try {
			const book = new Book({ title, author, issued });
			await book.save();

			pubsub.publish('BOOK_CREATED', { bookCreated: book });

			await redisClient.set(book.id, book);
			return {
				success: true,
				message: 'Book created successfully',
				book,
			};
		} catch (error) {
			logger.error(`Failed to create book in MongoDB: ${error}`);
			return {
				success: false,
				message: `Failed to create book: ${error}`,
				book: null,
			};
		}
	} else {
		const query = `INSERT INTO ${table} (title, author, issued) VALUES ($1, $2, $3) RETURNING *`;
		const params = [title, author, issued];

		try {
			const result = await executeQuery<any>(query, params);
			pubsub.publish('BOOK_CREATED', { bookCreated: result });
			logger.info(result);
			return {
				success: true,
				message: 'Book created successfully',
				book: result[0],
			};
		} catch (error) {
			logger.error(`Failed to create book: ${query} - ${error}`);
			return {
				success: false,
				message: `Failed to create book: ${error}`,
				book: null,
			};
		}
	}
};

const updateBook = async (
	parent: any,
	args: UpdatebookArgs,
): Promise<BookMutationResponse> => {
	const { id, title, author, issued = false } = args;
	// Validation
	if (!title && !author) {
		throw new Error('Title, author and issued all three cannot be empty');
	}

	if (currentDB === DBType.MONGODB) {
		try {
			const book = await Book.findByIdAndUpdate(
				id,
				{ title, author, issued },
				{ new: true },
			);
			if (book) {
				await redisClient.set(book.id, book);
			}
			return {
				success: true,
				message: 'Book created successfully',
				book,
			};
		} catch (error) {
			logger.error(`Failed to update book in MongoDB: ${error}`);
			return {
				success: false,
				message: `Failed to update book: ${error}`,
				book: null,
			};
		}
	} else {
		const query = `UPDATE ${table} SET title = $1, author = $2, issued = $3 WHERE id = $4 RETURNING *`;
		const params = [title, author, issued, id];
		try {
			const result = await executeQuery<any>(query, params);
			return {
				success: true,
				message: 'Book updated successfully',
				book: result[0],
			};
		} catch (error) {
			logger.error(`Failed to create book: ${query} - ${error}`);
			return {
				success: false,
				message: `Failed to update book: ${error}`,
				book: null,
			};
		}
	}
};

const deleteBook = async (parent: any, args: { id: string }): Promise<boolean> => {
	const { id } = args;

	if (currentDB === DBType.MONGODB) {
		try {
			const result = await Book.findByIdAndDelete(id);
			if (result) {
				await redisClient.deleteCachedData(id);
			}
			return !!result;
		} catch (error) {
			logger.error(`Failed to delete book in MongoDB: ${error}`);
			return false;
		}
	} else {
		const query = `DELETE FROM ${table} WHERE id = $1`;

		try {
			await executeQuery<any>(query, [id]);
			return true;
		} catch (error) {
			logger.error(`Failed to delete book : ${query} - ${error}`);
			return false;
		}
	}
};

const bookCreated = {
	subscribe: () => pubsub.asyncIterableIterator(['BOOK_CREATED']),
};

const getBookCreatedResolver = async (): Promise<AsyncIterator<unknown>> => {
	return pubsub.asyncIterableIterator('bookCreated');
};

export { getBook, getBooks, addBook, updateBook, deleteBook, bookCreated };

/**
 * Oracle
 * create table book_store ( "id" number generated always as identity, "title" varchar2(4000), "author" varchar2(4000), "issued" boolean, primary key ("id"));
 * 
 * PGSQL
 * 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE "book_store" (
	id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
	title VARCHAR(4000),
	author VARCHAR(4000),
	issued BOOLEAN NOT NULL DEFAULT TRUE
);
 * 
 * {
 "query": "mutation addBook($title: String!, $author: String!, $issued: Boolean!) { addBook(title: $title, author: $author, issued: $issued) }",
 "variables": {
	 "title": "Aasif",
	 "author": "Rasul",
	 "issued": false
 }
}
 * 
 * {
	"query": "{ getBook(id: \"67dbd86a20663aeb49393e32\") {id, title, author, issued} }"
}
 * 
 * 
 * {
	"query": "{ getBooks {id, title, author, issued} }"
}
 * 
 * 
 * {
 "query": "mutation updateBook($id: ID!, $title: String!, $author: String!, $issued: Boolean) { updateBook(id: $id, title: $title, author: $author, issued: $issued) }",
 "variables": {
	 "id": "67dbd86a20663aeb49393e32",
	 "title": "John",
	 "author": "Doe",
	 "issued": false
 }
}
 * 
 * 
 * 
 * {
 "query": "mutation deleteBook($id: ID!) { deleteBook(id: $id) }",
 "variables": {
	 "id": "67dbd86a20663aeb49393e32"
 }
}
 * 
 * 
*/
