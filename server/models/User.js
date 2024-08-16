const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		firstName: String,
		lastName: String,
		age: Number,
	},
	{
		toJSON: { virtuals: true },
	},
);

// Add a virtual `id` getter to expose `_id` as `id`
userSchema.virtual('id').get(function () {
	return this._id.toHexString();
});

// Transform the output to replace `_id` with `id`
userSchema.set('toJSON', {
	virtuals: true,
	transform: (doc, ret) => {
		delete ret.__v;
		ret.id = ret._id.toHexString();
		delete ret._id;
		return ret;
	},
});

User = mongoose.model('User', userSchema);

module.exports = { User };
