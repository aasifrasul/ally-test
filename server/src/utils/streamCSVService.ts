import fs from 'fs';
import readline from 'readline';

interface CsvRow {
	[key: string]: string;
}

export class StreamCSVService {
	private headersCache = new Map<string, Array<{ key: string; name: string }>>();

	async getHeaders(filePath: string): Promise<Array<{ key: string; name: string }>> {
		if (this.headersCache.has(filePath)) {
			return this.headersCache.get(filePath)!;
		}

		const fileStream = fs.createReadStream(filePath);
		const rl = readline.createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		});

		let headers: Array<{ key: string; name: string }> = [];

		for await (const line of rl) {
			const columns = line.split(',');
			columns[0] = 'count';
			headers = columns.map((i) => ({ key: i, name: i.toUpperCase() }));
			break; // Only read first line
		}

		this.headersCache.set(filePath, headers);
		return headers;
	}

	async getPageData(
		filePath: string,
		pageNum: number,
		pageSize: number = 10,
	): Promise<CsvRow[]> {
		const fileStream = fs.createReadStream(filePath);
		const rl = readline.createInterface({
			input: fileStream,
			crlfDelay: Infinity,
		});

		const startLine = pageNum * pageSize + 1; // +1 to skip header
		const endLine = startLine + pageSize;

		let currentLine = 0;
		let headers: string[] = [];
		const result: CsvRow[] = [];

		for await (const line of rl) {
			if (currentLine === 0) {
				// Parse headers
				headers = line.split(',');
				headers[0] = 'count';
			} else if (currentLine >= startLine && currentLine < endLine) {
				// Parse data row
				const processedRow = this.parseCSVRow(line);
				const obj: CsvRow = {};

				for (let j = 0; j < headers.length; j++) {
					obj[headers[j]] = processedRow[j] || '';
				}

				result.push(obj);
			} else if (currentLine >= endLine) {
				// We've read enough, break
				break;
			}

			currentLine++;
		}

		return result;
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
}
