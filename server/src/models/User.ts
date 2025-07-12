import { Schema, model } from 'mongoose';

import { IUser } from '../types';

const userSchema = new Schema<IUser>({
	first_name: { type: String, required: true },
	last_name: { type: String, required: true },
	age: { type: Number, required: true },
});

// Add a virtual `id` getter to expose `_id` as `id`
userSchema.virtual('id').get(function (this: { _id: { toHexString: () => string } }) {
	return this._id.toHexString();
});

// Transform the output to replace `_id` with `id`
userSchema.set('toJSON', {
	virtuals: true,
	transform: (doc, ret) => {
		ret.id = ret._id.toHexString();
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

// Also apply to toObject() calls
userSchema.set('toObject', {
	virtuals: true,
	transform: (doc, ret) => {
		ret.id = ret._id.toHexString();
		delete ret._id;
		delete ret.__v;
		return ret;
	},
});

export const User = model<IUser>('User', userSchema);
