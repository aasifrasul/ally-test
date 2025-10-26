import { IDBAdapter, IDBConnection } from './types';

export class SQLAdapter implements IDBAdapter {
	constructor(private connection: IDBConnection) {}

	async find<T>(collection: string, filter: any): Promise<T[]> {
		const { query, params } = this.buildSelectQuery(collection, filter);
		return await this.connection.executeQuery<T>(query, params);
	}

	async findOne<T>(collection: string, filter: any): Promise<T | null> {
		const { query, params } = this.buildSelectQuery(collection, filter, 1);
		const results = await this.connection.executeQuery<T>(query, params);
		return results[0] || null;
	}

	async insert<T>(collection: string, data: any): Promise<T> {
		const { query, params } = this.buildInsertQuery(collection, data);
		const result = await this.connection.executeQuery<T>(query, params);
		return result[0];
	}

	async update(collection: string, filter: any, data: any): Promise<number> {
		const { query, params } = this.buildUpdateQuery(collection, filter, data);
		const result = await this.connection.executeQuery<any>(query, params);
		return result.length || 0;
	}

	async delete(collection: string, filter: any): Promise<number> {
		const { query, params } = this.buildDeleteQuery(collection, filter);
		const result = await this.connection.executeQuery<any>(query, params);
		return result.length || 0;
	}

	async checkHealth(): Promise<boolean> {
		return await this.connection.checkHealth();
	}

	async cleanup(): Promise<void> {
		await this.connection.cleanup();
	}

	// Query builders
	private buildSelectQuery(
		table: string,
		filter: any,
		limit?: number,
	): { query: string; params: any[] } {
		const conditions: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		for (const [key, value] of Object.entries(filter)) {
			conditions.push(`${key} = $${paramIndex}`);
			params.push(value);
			paramIndex++;
		}

		let query = `SELECT * FROM ${table}`;
		if (conditions.length > 0) {
			query += ` WHERE ${conditions.join(' AND ')}`;
		}
		if (limit) {
			query += ` LIMIT ${limit}`;
		}

		return { query, params };
	}

	private buildInsertQuery(table: string, data: any): { query: string; params: any[] } {
		const keys = Object.keys(data);
		const values = Object.values(data);
		const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

		const query = `
      INSERT INTO ${table} (${keys.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING *
    `;

		return { query, params: values };
	}

	private buildUpdateQuery(
		table: string,
		filter: any,
		data: any,
	): { query: string; params: any[] } {
		const setClauses: string[] = [];
		const whereClauses: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		for (const [key, value] of Object.entries(data)) {
			setClauses.push(`${key} = $${paramIndex}`);
			params.push(value);
			paramIndex++;
		}

		for (const [key, value] of Object.entries(filter)) {
			whereClauses.push(`${key} = $${paramIndex}`);
			params.push(value);
			paramIndex++;
		}

		const query = `
      UPDATE ${table} 
      SET ${setClauses.join(', ')} 
      WHERE ${whereClauses.join(' AND ')}
    `;

		return { query, params };
	}

	private buildDeleteQuery(table: string, filter: any): { query: string; params: any[] } {
		const conditions: string[] = [];
		const params: any[] = [];
		let paramIndex = 1;

		for (const [key, value] of Object.entries(filter)) {
			conditions.push(`${key} = $${paramIndex}`);
			params.push(value);
			paramIndex++;
		}

		const query = `DELETE FROM ${table} WHERE ${conditions.join(' AND ')}`;
		return { query, params };
	}
}
