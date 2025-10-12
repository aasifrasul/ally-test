import type { Request, Application } from 'express';
import multer from 'multer';
import { pathFileUpload } from './paths';

const storage = multer.diskStorage({
	destination: function (
		req: Request,
		file: Express.Multer.File,
		cb: (error: Error | null, destination: string) => void,
	) {
		cb(null, pathFileUpload); // Specify the destination folder
	},
	filename: function (req: Request, file: Express.Multer.File, cb: Function) {
		cb(null, Date.now() + '-' + file.originalname); // Generate a unique filename
	},
});

const upload = multer({ storage: storage });
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

export const handleFileupload = (app: Application) => {
	app.post('/profile', upload.single('avatar'), function (req, res, next) {
		// req.file is the `avatar` file
		// req.body will hold the text fields, if there were any
	});

	app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
		// req.files is array of `photos` files
		// req.body will contain the text fields, if there were any
	});

	const cpUpload = upload.fields([
		{ name: 'avatar', maxCount: 1 },
		{ name: 'gallery', maxCount: 8 },
	]);
	app.post('/cool-profile', cpUpload, function (req, res, next) {
		// req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
		//
		// e.g.
		//  req.files['avatar'][0] -> File
		//  req.files['gallery'] -> Array
		//
		// req.body will contain the text fields, if there were any
	});
};
