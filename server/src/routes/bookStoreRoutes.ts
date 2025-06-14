import express, { Request, Response, NextFunction } from 'express';

// Middleware to load bookStore for all routes
const router = express.Router();
const bookStorePath = './store/bookStore';

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

// Middleware to load bookStore for all routes
router.use(async (req: BookStoreRequest, res: Response, next: NextFunction) => {
	req.bookStore = (await import(bookStorePath)) as BookStore;
	next();
});

// Book resource routes
router
	.route('/')
	.get((req: BookStoreRequest, res: Response) => {
		res.json(req.bookStore?.getBooks());
	})
	.post((req: BookStoreRequest, res: Response) => {
		req.bookStore?.addBook(req.body);
		res.json({ message: 'Book added successfully' });
	});

router
	.route('/:id')
	.get((req: BookStoreRequest, res: Response) => {
		res.json(req.bookStore?.getBook(req.params.id));
	})
	.put((req: BookStoreRequest, res: Response) => {
		req.bookStore?.updateBook(req.params.id, req.body);
		res.json({ message: 'Book updated successfully' });
	})
	.delete((req: BookStoreRequest, res: Response) => {
		req.bookStore?.deleteBook(req.params.id);
		res.json({ message: 'Book deleted successfully' });
	});

export default router;
