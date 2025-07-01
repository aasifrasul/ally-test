export interface User {
	id: string;
	first_name: string;
	last_name: string;
	age: number;
}

export type AddUser = (first_name: string, last_name: string, age: number) => void;
export type EditUser = (id: string) => void;
export type DeleteUser = (id: string) => void;
export type UpdateUser = (
	id: string,
	first_name: string,
	last_name: string,
	age: number,
) => void;
