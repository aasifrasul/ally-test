import { Schema, model, Document } from 'mongoose';

export interface IBook {
	title: string;
	author: string;
	status: 'available' | 'issued';
}

// Interface for a Book document (including Document properties like _id)
export interface IBookDocument extends IBook, Document {
	id: string; // Virtual field
}

const bookSchema = new Schema<IBookDocument>(
	{
		title: { type: String, required: true },
		author: { type: String, required: true },
		status: {
			type: String,
			required: true,
			enum: ['available', 'issued'],
			default: 'available',
		},
	},
	{
		timestamps: true, // Adds createdAt and updatedAt fields
		toJSON: { virtuals: true },
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
