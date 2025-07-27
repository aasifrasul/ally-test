// DevTools integration for debugging
interface QueryLog {
	id: string;
	query: string;
	variables?: any;
	timestamp: number;
	duration?: number;
	cached: boolean;
	result?: any;
	error?: string;
}

class GraphQLDevTools {
	private logs: QueryLog[] = [];
	private isEnabled: boolean = false;

	constructor() {
		// Enable in development
		this.isEnabled = process.env.NODE_ENV === 'development';

		if (this.isEnabled && typeof window !== 'undefined') {
			// Expose to window for browser debugging
			(window as any).__GRAPHQL_DEVTOOLS__ = this;
			console.log('GraphQL DevTools enabled. Access via window.__GRAPHQL_DEVTOOLS__');
		}
	}

	logQuery(query: string, variables?: any, cached: boolean = false): string {
		if (!this.isEnabled) return '';

		const id = `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const log: QueryLog = {
			id,
			query: query.trim(),
			variables,
			timestamp: Date.now(),
			cached,
		};

		this.logs.push(log);

		// Keep only last 100 logs
		if (this.logs.length > 100) {
			this.logs.shift();
		}

		return id;
	}

	logResult(id: string, result?: any, error?: string, duration?: number): void {
		if (!this.isEnabled) return;

		const log = this.logs.find((l) => l.id === id);
		if (log) {
			log.result = result;
			log.error = error;
			log.duration = duration;

			// Log to console with nice formatting
			const status = error ? '❌' : log.cached ? '💾' : '✅';
			const time = duration ? `${duration}ms` : 'N/A';

			console.groupCollapsed(
				`${status} GraphQL ${log.cached ? '(cached)' : ''} - ${time}`,
			);
			console.log('Query:', log.query);
			if (log.variables) console.log('Variables:', log.variables);
			if (log.result) console.log('Result:', log.result);
			if (log.error) console.error('Error:', log.error);
			console.groupEnd();
		}
	}

	// Methods for debugging
	getLogs(): QueryLog[] {
		return [...this.logs];
	}

	clearLogs(): void {
		this.logs = [];
		console.log('GraphQL logs cleared');
	}

	getStats() {
		const total = this.logs.length;
		const cached = this.logs.filter((l) => l.cached).length;
		const errors = this.logs.filter((l) => l.error).length;
		const avgDuration =
			this.logs
				.filter((l) => l.duration)
				.reduce((sum, l) => sum + (l.duration || 0), 0) /
			this.logs.filter((l) => l.duration).length;

		return {
			total,
			cached,
			errors,
			cacheHitRate: `${((cached / total) * 100).toFixed(1)}%`,
			avgDuration: `${avgDuration.toFixed(2)}ms`,
		};
	}

	printStats(): void {
		console.table(this.getStats());
	}
}

export const devTools = new GraphQLDevTools();

// Enhanced executeQuery with devtools integration
export const executeQueryWithDevTools = async <T = any,>(
	query: string,
	variables?: any,
	options: QueryOptions = {},
): Promise<T> => {
	const startTime = Date.now();
	const cached =
		!query.trim().toLowerCase().startsWith('mutation') &&
		graphQLCache.get(query, variables) !== null;

	const logId = devTools.logQuery(query, variables, cached);

	try {
		const result = await executeQueryWithCache<T>(query, variables, options);
		const duration = Date.now() - startTime;

		devTools.logResult(logId, result, undefined, duration);
		return result;
	} catch (error) {
		const duration = Date.now() - startTime;
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';

		devTools.logResult(logId, undefined, errorMessage, duration);
		throw error;
	}
};

// React DevTools component
export function GraphQLDevPanel() {
	const [logs, setLogs] = useState<QueryLog[]>([]);
	const [showPanel, setShowPanel] = useState(false);

	useEffect(() => {
		if (process.env.NODE_ENV === 'development') {
			const interval = setInterval(() => {
				setLogs(devTools.getLogs());
			}, 1000);

			return () => clearInterval(interval);
		}
	}, []);

	if (process.env.NODE_ENV !== 'development' || !showPanel) {
		return (
			<button
				onClick={() => setShowPanel(true)}
				className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded shadow-lg z-50"
				style={{ display: process.env.NODE_ENV === 'development' ? 'block' : 'none' }}
			>
				📊 GraphQL
			</button>
		);
	}

	return (
		<div className="fixed bottom-0 right-0 w-96 h-64 bg-white border-2 border-gray-300 shadow-lg z-50 overflow-auto">
			<div className="flex justify-between items-center p-2 bg-gray-100 border-b">
				<span className="font-bold">GraphQL DevTools</span>
				<button onClick={() => setShowPanel(false)} className="text-red-500">
					✕
				</button>
			</div>

			<div className="p-2">
				<button
					onClick={() => devTools.clearLogs()}
					className="mb-2 px-2 py-1 bg-red-500 text-white rounded text-sm"
				>
					Clear Logs
				</button>

				<div className="text-xs space-y-1">
					{logs.slice(-10).map((log) => (
						<div key={log.id} className="border-b pb-1">
							<div className="flex justify-between">
								<span
									className={
										log.error
											? 'text-red-500'
											: log.cached
												? 'text-blue-500'
												: 'text-green-500'
									}
								>
									{log.error ? '❌' : log.cached ? '💾' : '✅'}
								</span>
								<span>{log.duration}ms</span>
							</div>
							<div className="truncate text-gray-600">
								{log.query.replace(/\s+/g, ' ').substring(0, 50)}...
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
