import { Schema, model } from 'mongoose';

import { IUser } from '../types';

const userSchema = new Schema<IUser>(
	{
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		age: { type: Number, required: true },
	},
	{
		toJSON: { virtuals: true },
	},
);

// Add a virtual `id` getter to expose `_id` as `id`
userSchema.virtual('id').get(function (this: { _id: { toHexString: () => string } }) {
	return this._id.toHexString();
});

// Transform the output to replace `_id` with `id`
userSchema.set('toJSON', {
	virtuals: true,
	transform: (doc: any, ret: any) => {
		delete ret.__v;
		ret.id = ret._id.toHexString();
		delete ret._id;
		return ret;
	},
});

const User = model<IUser>('User', userSchema);

export { User };
