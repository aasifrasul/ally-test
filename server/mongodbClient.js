const { MongoClient } = require('mongodb');
// Replace the uri string with your connection string.
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);
async function run() {
	try {
		const database = client.db('test');
		const products = database.collection('products');
		await products.insertOne({ name: 'ABC2', category: 'XYZ2' });
		// Query for a product that has the title 'Back to the Future'
		const query = { name: 'ABC2' };
		const product = await products.findOne(query);
		console.log('product', product);
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);
