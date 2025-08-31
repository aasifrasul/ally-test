export enum HTTPMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	PATCH = 'PATCH',
	DELETE = 'DELETE',
}
export interface WorkerMessage {
	id: string;
	type: string;
	data: any;
	error?: string;
}

export interface WorkerResponse {
	id: number;
	type: string;
	data?: any;
	error?: string;
}
