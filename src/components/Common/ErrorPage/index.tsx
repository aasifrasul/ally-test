import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

function ErrorPage() {
	const error = useRouteError();
	console.error(error);

	const errorMessage = isRouteErrorResponse(error)
		? error.statusText || error.data?.message
		: error instanceof Error
			? error.message
			: 'Unknown error occurred';

	return (
		<div className="min-h-screen flex items-center justify-center">
			<div className="text-center p-8">
				<h1 className="text-4xl font-bold mb-4">Oops!</h1>
				<p className="mb-4">Sorry, an unexpected error has occurred.</p>
				<p className="italic text-gray-600 mb-6">{errorMessage}</p>
				<Link to="/" className="text-blue-500 hover:text-blue-700 underline">
					Go Home
				</Link>
			</div>
		</div>
	);
}

export default ErrorPage;
