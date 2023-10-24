// Step 1: Initialize the IndexedDB database
let db;
function openDatabase() {
	const request = (self || window).indexedDB.open('myDB', 1);

	request.addEventListener('success', function (event) {
		db = event.target.result;
		console.log('Database opened successfully');
	});

	request.addEventListener('error', function (event) {
		console.error('Database error:', event.target.error);
	});

	request.addEventListener('upgradeneeded', function (event) {
		const database = event.target.result;

		const objectStore = database.createObjectStore('myObjectStore', {
			keyPath: 'id',
			autoIncrement: true,
		});

		objectStore.transaction.addEventListener('complete', function (event) {
			debugger;
		});

		// You can define additional indexes for searching or sorting data using `objectStore.createIndex()`
	});
}

// Step 2: Create an object store
openDatabase();

// Step 3: CRUD operations
function addData(dataObject) {
	const transaction = db.transaction(['myObjectStore'], 'readwrite');
	const objectStore = transaction.objectStore('myObjectStore');

	const request = objectStore.add(dataObject);

	request.addEventListener('success', function (event) {
		console.log('Data added successfully');
	});

	request.addEventListener('error', function (event) {
		console.error('Data addition error:', event.target.error);
	});
}

function editData(id, newData) {
	const transaction = db.transaction(['myObjectStore'], 'readwrite');
	const objectStore = transaction.objectStore('myObjectStore');

	const request = objectStore.put(newData, id);

	request.addEventListener('success', function (event) {
		console.log('Data updated successfully');
	});

	request.addEventListener('error', function (event) {
		console.error('Data update error:', event.target.error);
	});
}

function deleteData(id) {
	const transaction = db.transaction(['myObjectStore'], 'readwrite');
	const objectStore = transaction.objectStore('myObjectStore');

	const request = objectStore.delete(id);

	request.addEventListener('success', function (event) {
		console.log('Data deleted successfully');
	});

	request.addEventListener('error', function (event) {
		console.error('Data deletion error:', event.target.error);
	});
}

// Example usage:
addData({ name: 'John Doe', age: 30 });
editData(1, { name: 'Jane Smith', age: 35 });
deleteData(1);
