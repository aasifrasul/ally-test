import { executeQuery } from '../dbClients/helper';
import { DBType, IUser } from '../types';
import { constants } from '../constants';
import { User } from '../models'; // Mongoose model if MongoDB

export interface IUserRepository {
	findById(id: string): Promise<IUser | undefined>;
	findByEmail(email: string): Promise<IUser | undefined>;
	findAll(limit: number, offset: number): Promise<IUser[]>;
	create(data: IUser): Promise<IUser>;
	updateById(id: string, updates: Partial<IUser>): Promise<IUser | undefined>;
	deleteById(id: string): Promise<IUser | undefined>;
	updatePassword(id: string, hashedPassword: string): Promise<IUser | undefined>;
}

const MongoRepo: IUserRepository = {
	async findById(id) {
		const user = await User.findById(id).lean<IUser>();
		return user || undefined;
	},
	async findByEmail(email: string) {
		const user = await User.findOne({ email }).exec();
		return user ? (user.toObject() as IUser) : undefined;
	},
	async findAll() {
		throw new Error('Not implemented');
	},
	async create(data) {
		const user = await User.create(data);
		return user.toObject();
	},
	async updateById(id, updates) {
		return (
			(await User.findByIdAndUpdate(
				id,
				{ $set: updates },
				{ new: true },
			).lean<IUser>()) || undefined
		);
	},
	async deleteById(id) {
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

const PostgresRepo: IUserRepository = {
	async findById(id) {
		const rows = await executeQuery<IUser>('SELECT * FROM users WHERE id = $1', [id]);
		return rows[0];
	},
	async findByEmail(email: string) {
		const rows = await executeQuery<IUser>('SELECT * FROM users WHERE email = $1', [
			email,
		]);
		return rows?.[0];
	},
	async findAll(limit: number, offset: number) {
		return await User.find()
			.select('-password')
			.limit(limit)
			.skip(offset)
			.lean<IUser[]>()
			.exec();
	},
	async create(data) {
		const rows = await executeQuery<IUser>(
			'INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *',
			[data.name, data.email, data.age],
		);
		return rows[0];
	},
	async updateById(id, updates) {
		const keys = Object.keys(updates);
		if (!keys.length) return undefined;
		const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
		const values = Object.values(updates);
		const query = `UPDATE users SET ${setClause} WHERE id = $${
			keys.length + 1
		} RETURNING *`;
		const rows = await executeQuery<IUser>(query, [...values, id]);
		return rows[0];
	},
	async deleteById(id) {
		const rows = await executeQuery<IUser>('DELETE FROM users WHERE id = $1 RETURNING *', [
			id,
		]);
		return rows[0];
	},
	async updatePassword(id: string, hashedPassword: string) {
		const query = `
            UPDATE users SET password = $1 WHERE id = $2 RETURNING id, name, email, age
        `;
		const rows = await executeQuery<IUser>(query, [hashedPassword, id]);
		return rows?.[0];
	},
};

const { currentDB } = constants.dbLayer;

export const userRepo: IUserRepository =
	currentDB === DBType.MONGODB ? MongoRepo : PostgresRepo;
