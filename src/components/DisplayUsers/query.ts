export const GET_USERS = `{ getUsers { id, first_name, last_name, age } }`;
export const USER_CREATED_SUBSCRIPTION =
	'subscription { userCreated { id, first_name, last_name, age } }';
export const CREATE_USER = `
mutation createUser($first_name: String!, $last_name: String!, $age: Int!) {
	createUser(first_name: $first_name, last_name: $last_name, age: $age) {
		success 
		message 
		user { id first_name last_name age }
	}
}`;
export const UPDATE_USER = `
mutation updateUser($id: ID!, $first_name: String!, $last_name: String!, $age: Int!) { 
	updateUser(id: $id, first_name: $first_name, last_name: $last_name, age: $age) { 
		success 
		message 
		user { id first_name last_name age } 
	} 
}`;
export const DELETE_USER = `
mutation deleteUser($id: ID!) { 
	deleteUser(id: $id) { 
		success 
		message 
		id 
	} 
}`;
