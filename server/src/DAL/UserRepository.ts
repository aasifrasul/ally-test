import { constants } from '../constants';
import { executeQuery } from '../dbClients/helper';
import { DatabaseOperationError, DatabaseConflictError } from '../Error';
import { User } from '../models';
import { DBType, IUser } from '../types';

// --- Repository Interface ---
// This defines the contract for ANY user repository (Mongo, Postgres, etc.)
export interface IUserRepository {
	findByEmail(email: string): Promise<IUser | undefined>;
	findById(id: string): Promise<IUser | undefined>;
	findAll(limit: number, offset: number): Promise<IUser[]>;
	create(data: IUser): Promise<IUser>;
	updateById(id: string, updates: Partial<IUser>): Promise<IUser | undefined>;
	deleteById(id: string): Promise<IUser | undefined>;
	updatePassword(id: string, hashedPassword: string): Promise<IUser | undefined>;
}

const NotImplementedRepo: IUserRepository = {
	async findByEmail() {
		throw new Error('Not implemented');
	},
	async findById() {
		throw new Error('Not implemented');
	},
	async findAll() {
		throw new Error('Not implemented');
	},
	async create() {
		throw new Error('Not implemented');
	},
	async updateById() {
		throw new Error('Not implemented');
	},
	async deleteById() {
		throw new Error('Not implemented');
	},
	async updatePassword() {
		throw new Error('Not implemented');
	},
};

// --- MONGODB Implementation ---
const MongoRepo: IUserRepository = {
	async findByEmail(email: string) {
		const user = await User.findOne({ email }).exec();
		return user ? (user.toObject() as IUser) : undefined;
	},
	async findById(id: string) {
		const user = await User.findById(id).exec();
		return user ? (user.toObject() as IUser) : undefined;
	},
	async findAll(limit: number, offset: number) {
		return await User.find()
			.select('-password')
			.limit(limit)
			.skip(offset)
			.lean<IUser[]>()
			.exec();
	},
	async create(data: IUser) {
		try {
			const newUser = new User(data);
			return (await newUser.save()).toObject() as IUser;
		} catch (err: any) {
			// Translate database-specific error (11000 is Mongo Duplicate Key)
			if (err.code === 11000) {
				throw new DatabaseConflictError('Duplicate key error (email)');
			}
			throw new DatabaseOperationError('MongoDB create failed', { cause: err });
		}
	},
	async updateById(id: string, updates: Partial<IUser>) {
		return (
			(await User.findByIdAndUpdate(
				id,
				{ $set: updates },
				{ new: true, runValidators: true },
			).lean<IUser>()) || undefined
		);
	},
	async deleteById(id: string) {
		return (await User.findByIdAndDelete(id).lean<IUser>()) || undefined;
	},
	async updatePassword(id: string, hashedPassword: string) {
		return (
			(await User.findByIdAndUpdate(
				id,
				{ $set: { password: hashedPassword } },
				{ new: true },
			).lean<IUser>()) || undefined
		);
	},
};

// --- POSTGRES Implementation ---
const PostgresRepo: IUserRepository = {
	async findByEmail(email: string) {
		const rows = await executeQuery<IUser>('SELECT * FROM users WHERE email = $1', [
			email,
		]);
		return rows?.[0];
	},
	async findById(id: string) {
		const rows = await executeQuery<IUser>('SELECT * FROM users WHERE id = $1', [id]);
		return rows?.[0];
	},
	async findAll(limit: number, offset: number) {
		return await executeQuery<IUser>(
			'SELECT id, name, email, age FROM users LIMIT $1 OFFSET $2',
			[limit, offset],
		);
	},
	async create(data: IUser) {
		const query = `
            INSERT INTO users (name, email, age, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, age
        `;
		try {
			const rows = await executeQuery<IUser>(query, [
				data.name,
				data.email,
				data.age,
				data.password,
			]);
			return rows?.[0] as IUser; // Cast is necessary since query returns non-password fields
		} catch (err: any) {
			// Translate database-specific error ('23505' is Postgres Unique Violation)
			if (err.code === '23505') {
				throw new DatabaseConflictError('Duplicate key error (email)');
			}
			throw new DatabaseOperationError('Postgres create failed', { cause: err });
		}
	},
	async updateById(id: string, updates: Partial<IUser>) {
		const fields = Object.keys(updates);
		const values = Object.values(updates);
		const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
		const query = `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING id, name, email, age`;
		const rows = await executeQuery<IUser>(query, [...values, id]);
		return rows?.[0];
	},
	async deleteById(id: string) {
		const rows = await executeQuery<IUser>(
			'DELETE FROM users WHERE id = $1 RETURNING id',
			[id],
		);
		return rows?.[0];
	},
	async updatePassword(id: string, hashedPassword: string) {
		const query = `
            UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email, age
        `;
		const rows = await executeQuery<IUser>(query, [hashedPassword, id]);
		return rows?.[0];
	},
};

const userRepo: Record<DBType, IUserRepository> = {
	[DBType.MONGODB]: MongoRepo,
	[DBType.POSTGRES]: PostgresRepo,
	[DBType.MYSQL]: NotImplementedRepo,
	[DBType.ORACLE]: NotImplementedRepo,
};

const { currentDB } = constants.dbLayer;

export const repo: IUserRepository = userRepo[currentDB];
if (!repo) {
	throw new Error(`Unsupported database type: ${currentDB}`);
}
