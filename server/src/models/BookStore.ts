import { Schema, model, Document } from 'mongoose';

export interface IBook {
	title: string;
	author: string;
	issued: boolean;
}

// Interface for a Book document (including Document properties like _id)
export interface IBookDocument extends IBook, Document {
	id: string; // Virtual field
}

export interface BookMutationResponse {
	success: Boolean;
	book?: IBookDocument | null;
	message?: string;
}

export interface BookArgs extends Partial<IBook> {
	id?: string;
}

export interface UpdatebookArgs extends Partial<IBook> {
	id: string;
}

const bookSchema = new Schema<IBookDocument>(
	{
		title: { type: String, required: true },
		author: { type: String, required: true },
		issued: {
			type: Boolean,
			required: true,
			default: false,
		},
	},
	{
		timestamps: true, // Adds createdAt and updatedAt fields
	},
);

// Add a virtual `id` getter to expose `_id` as `id`
bookSchema.virtual('id').get(function (this: { _id: { toHexString: () => string } }) {
	return this._id.toHexString();
});

// Transform the output
bookSchema.set('toJSON', {
	virtuals: true,
	transform: (_doc, ret) => {
		ret.id = ret._id.toString();
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export const Book = model<IBookDocument>('Book', bookSchema);
