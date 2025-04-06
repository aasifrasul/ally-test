import { Schema, model } from 'mongoose';
import { IProduct } from '../types';

const productSchema = new Schema<IProduct>({
	name: { type: String, required: true },
	category: { type: String, required: true },
});

// Add a virtual `id` getter to expose `_id` as `id`
productSchema.virtual('id').get(function (this: { _id: { toHexString: () => string } }) {
	return this._id.toHexString();
});

// Transform the output to replace `_id` with `id` and include virtuals.
productSchema.set('toJSON', {
	virtuals: true,
	transform: (doc: any, ret: any) => {
		delete ret.__v;
		ret.id = ret._id.toHexString();
		delete ret._id;
		return ret;
	},
});

export const Product = model<IProduct>('Product', productSchema);
