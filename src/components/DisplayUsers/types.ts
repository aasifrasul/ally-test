export interface User {
	id: string;
	name: string;
	email: string;
	age?: number;
	passwword?: string;
}

export type AddUser = (name: string, email: string, age?: number) => Promise<void>;
export type EditUser = (id: string) => void;
export type DeleteUser = (id: string) => Promise<void>;
export type UpdateUser = (
	id: string,
	name: string,
	email: string,
	age?: number,
) => Promise<void>;
