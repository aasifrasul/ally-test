export const GET_USERS = `{ getUsers { id, name, email, age } }`;
export const USER_CREATED_SUBSCRIPTION =
	'subscription { userCreated { id, name, email, age } }';
export const CREATE_USER = `
mutation createUser($name: String!, $email: String!, $age: Int!, password: $String!) {
	createUser(name: $name, email: $email, age: $age, password: $password) {
		success 
		message 
		user { id name email age }
	}
}`;
export const UPDATE_USER = `
mutation updateUser($id: ID!, $name: String!, $email: String!, $age: Int!) { 
	updateUser(id: $id, name: $name, email: $email, age: $age) { 
		success 
		message 
		user { id name email age } 
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
