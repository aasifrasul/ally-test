// Reading the file using default
// fs npm package
import { getFileContents } from './helper';

interface CsvRow {
	[key: string]: string | string[];
}

let obj: CsvRow = {};

export const fetchCSVasJSON = (filePath: string) => {
	const csv = getFileContents(filePath);

	// Convert the data to String and
	// split it in an array
	const array = csv.toString().split('\n');

	// All the rows of the CSV will be
	// converted to JSON objects which
	// will be added to result in an array
	const result = [];

	// The array[0] contains all the
	// header columns so we store them
	// in headers array
	const columns = array[0].split(',');
	columns[0] = 'count';
	const headers = columns.map((i) => ({ key: i, name: i.toUpperCase() }));

	// Since headers are separated, we
	// need to traverse remaining n-1 rows.
	for (let i = 1; i < array.length - 1; i++) {
		// Create an empty object to later add
		// values of the current row to it
		// Declare string str as current array
		// value to change the delimiter and
		// store the generated string in a new
		// string s
		let str = array[i];
		let s = '';

		// By Default, we get the comma separated
		// values of a cell in quotes " " so we
		// use flag to keep track of quotes and
		// split the string accordingly
		// If we encounter opening quote (")
		// then we keep commas as it is otherwise
		// we replace them with pipe |
		// We keep adding the characters we
		// traverse to a String s
		let flag = 0;
		for (let ch of str) {
			if (ch === '"' && flag === 0) {
				flag = 1;
			} else if (ch === '"' && flag == 1) flag = 0;
			if (ch === ',' && flag === 0) ch = '|';
			if (ch !== '"') s += ch;
		}

		// Split the string using pipe delimiter |
		// and store the values in a properties array
		const properties = s.split('|');

		// For each header, if the value contains
		// multiple comma separated data, then we
		// store it in the form of array otherwise
		// directly the value is stored
		for (let j in columns) {
			obj[columns[j]] = properties[j];
		}

		// Add the generated object to our
		// result array
		result.push(obj);
	}

	// Convert the resultant array to json and
	// generate the JSON output file.
	// let json = JSON.stringify(result);
	return { headers, result };
};
