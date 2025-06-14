import fs from 'fs/promises';
import path from 'path';

interface CsvRow {
	[key: string]: string | string[];
}

interface CsvData {
	headers: Array<{ key: string; name: string }>;
	result: CsvRow[];
}

class CSVService {
	private cache = new Map<string, CsvData>();
	private loadingPromises = new Map<string, Promise<CsvData>>();

	async fetchCSVasJSON(filePath: string): Promise<CsvData> {
		// Check if already cached
		if (this.cache.has(filePath)) {
			return this.cache.get(filePath)!;
		}

		// Check if already loading
		if (this.loadingPromises.has(filePath)) {
			return this.loadingPromises.get(filePath)!;
		}

		// Start loading
		const loadingPromise = this.loadCSV(filePath);
		this.loadingPromises.set(filePath, loadingPromise);

		try {
			const data = await loadingPromise;
			this.cache.set(filePath, data);
			return data;
		} finally {
			this.loadingPromises.delete(filePath);
		}
	}

	private async loadCSV(filePath: string): Promise<CsvData> {
		const csv = await fs.readFile(filePath, 'utf-8');
		const array = csv.toString().split('\n');
		const result: CsvRow[] = [];

		// Process headers
		const columns = array[0].split(',');
		columns[0] = 'count';
		const headers = columns.map((i) => ({ key: i, name: i.toUpperCase() }));

		// Process rows
		for (let i = 1; i < array.length - 1; i++) {
			const obj: CsvRow = {};
			const processedRow = this.parseCSVRow(array[i]);

			for (let j = 0; j < columns.length; j++) {
				obj[columns[j]] = processedRow[j] || '';
			}

			result.push(obj);
		}

		return { headers, result };
	}

	private parseCSVRow(str: string): string[] {
		let s = '';
		let flag = 0;

		for (let ch of str) {
			if (ch === '"' && flag === 0) {
				flag = 1;
			} else if (ch === '"' && flag === 1) {
				flag = 0;
			}

			if (ch === ',' && flag === 0) {
				ch = '|';
			}

			if (ch !== '"') {
				s += ch;
			}
		}

		return s.split('|');
	}

	// Optional: Clear cache if needed
	clearCache(filePath?: string) {
		if (filePath) {
			this.cache.delete(filePath);
		} else {
			this.cache.clear();
		}
	}
}

// Singleton instance
export const csvService = new CSVService();
