import express from 'express';
import type { Request, Response } from 'express';

import { asyncHandler } from '../utils/routeUtils';

import { addBook, updateBook, deleteBook, getBooks, getBook } from '../schema/bookStore';

// Middleware to load bookStore for all routes
const router = express.Router();

interface BookStore {
	getBooks: () => any[];
	addBook: (book: any) => void;
	getBook: (id: string) => any;
	updateBook: (id: string, book: any) => void;
	deleteBook: (id: string) => void;
}

interface BookStoreRequest extends Request {
	bookStore?: BookStore;
}

// Book resource routes
router
	.route('/')
	.get((req: BookStoreRequest, res: Response) => {
		res.json(getBooks(null, {}));
	})
	.post((req: BookStoreRequest, res: Response) => {
		addBook(null, req.body);
		res.json({ message: 'Book added successfully' });
	});

router
	.route('/:id')
	.get((req: BookStoreRequest, res: Response) => {
		res.json(getBook(null, { id: req.params.id }));
	})
	.put((req: BookStoreRequest, res: Response) => {
		updateBook(req.params.id, req.body);
		res.json({ message: 'Book updated successfully' });
	})
	.delete((req: BookStoreRequest, res: Response) => {
		deleteBook(null, { id: req.params.id });
		res.json({ message: 'Book deleted successfully' });
	});

// Book store routes with authentication
router
	.route('/api/bookStore/')
	.get(
		asyncHandler(async (req: any, res) => {
			const books = (await getBooks(null, {})) || [];

			// You can customize response based on user authentication
			if (req.user) {
				// Authenticated user gets full data
				res.json({ books, user: req.user });
			} else {
				// Unauthenticated user gets limited data
				res.json({
					books: books.map((book: any) => ({ id: book.id, title: book.title })),
				});
			}
		}),
	)
	.post(
		asyncHandler(async (req: any, res) => {
			const book = { ...req.body, createdBy: req.user.id };
			await addBook(null, book);
			res.json({ message: 'Book added successfully' });
		}),
	);

router
	.route('/api/bookStore/:id')
	.put(
		asyncHandler(async (req: any, res) => {
			const id = req.params.id;
			const book = req.body;

			// Check if user owns the book or is admin
			const existingBook = await getBook(null, id);
			if (existingBook?.createdBy !== req.user.id && req.user.role !== 'admin') {
				return res.status(403).json({ error: 'Not authorized to update this book' });
			}

			updateBook(id, book);
			res.json({ message: 'Book updated successfully' });
		}),
	)
	.delete(
		asyncHandler(async (req, res) => {
			deleteBook(null, { id: req.params.id });
			res.json({ message: 'Book deleted successfully' });
		}),
	);

export default router;
