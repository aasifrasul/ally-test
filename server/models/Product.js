const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
	{
		name: String,
		category: String,
	},
	{
		toJSON: { virtuals: true },
	},
);

// Add a virtual `id` getter to expose `_id` as `id`
productSchema.virtual('id').get(function () {
	return this._id.toHexString();
});

// Transform the output to replace `_id` with `id`
productSchema.set('toJSON', {
	virtuals: true,
	transform: (doc, ret) => {
		delete ret.__v;
		ret.id = ret._id.toHexString();
		delete ret._id;
		return ret;
	},
});

Product = mongoose.model('Product', productSchema);

module.exports = { Product };
