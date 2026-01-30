# Ally-Test: AI Development Guidelines

This is a React 19 + TypeScript + Express framework emphasizing worker-based async operations, schema-based state management, declarative components, and end-to-end type safety with GraphQL.

## Architecture Overview

### Four Core Pillars

**1. Web Worker-Based Data Fetching**

- All HTTP calls offload to `WorkerQueue` singleton (`src/workers/WorkerQueue.ts`)
- Main thread stays responsive; heavy operations (fetch, image loading) run in workers via `MyWorker.worker.ts`
- Request deduplication by URL+options; same request called 5 times = 1 network call
- Fallback to main-thread if worker unavailable (`executeInMainThread()`)
- **Entry point:** `useFetch<Schema>()` hook delegates to `WorkerQueue.fetchAPIData()`

**2. Schema-Based State Management (Redux-lite)**

- Define schemas in `src/constants/types.ts` (enum `Schema`) - e.g., `INFINITE_SCROLL`, `MOVIE_LIST`
- Map schema → response type via `SchemaToResponse` type (compile-time safety)
- Register schema endpoint + headers in `src/constants/dataSources.ts`
- Create reducer in `src/reducers/` handling `ActionType.FETCH_SUCCESS`, `.FETCH_FAILURE`, etc.
- **No Redux boilerplate:** Schema + Reducer + DataSource = complete pipeline
- State accessed via `getList(schema)` or ConnectDataFetch HOC

**3. Form Generation from JSON**

- `src/components/Common/FormGenerator/` renders complex forms declaratively from JSON
- Supports validation rules, conditional fields, dynamic data binding
- JSON flows from APIs for runtime form structure changes (no code redeploy needed)

**4. ConnectDataFetch HOC + Type-Safe Component Wiring**

- HOC at `src/HOCs/ConnectDataFetch.tsx` injects fetched data + dispatch
- Combines `mapStateToProps`/`mapDispatchToProps` patterns cleanly
- Typed to prevent schema mismatch bugs at compile-time

## Key Patterns & Conventions

### Using `useFetch` Hook (Primary Data Interface)

```typescript
// src/hooks/useFetch/index.ts - Type-safe, SWR-like caching
const { data, fetchData, fetchNextPage, updateData, refetch, isStale } =
	useFetch<Schema.MOVIE_LIST>(Schema.MOVIE_LIST, {
		timeout: 3000,
		staleTime: 5000, // SWR-style stale time
		refetchOnWindowFocus: true, // Auto-refetch on tab focus
		refetchInterval: 0, // Polling disabled by default
		transformResponse: (raw) => raw.results, // Normalize API response shape
		onSuccess: (data) => console.log('Data ready'), // Hooks for side effects
		retry: 3,
		retryDelay: (attempt) => Math.min(1000 * 2 ** (attempt - 1), 30000), // Exponential backoff
		updateCache: (old, updated) => [...old, updated], // Optimistic local updates
	});

// Always call fetchData explicitly (NOT auto-called on mount)
const handleLoad = async () => {
	const result = await fetchData();
	if (!result.success) {
		/* handle error */
	}
};
```

**Key insight:** Hook returns promises; use `await` or `.then()` to handle results. `refetch()` bypasses cache.

### Refs for Stable Hook Dependencies

Mutable callbacks wrapped in `useRef` to avoid re-attaching event listeners on every render:

```typescript
const fetchDataRef = useRef(fetchData); // fetchData reference
useEffect(() => {
	window.addEventListener('focus', fetchDataRef.current);
	return () => window.removeEventListener('focus', fetchDataRef.current);
}, []); // Stable dependencies despite fetchData changes
```

### Adding New Data Schema (5-Step Pattern)

1. **Add enum value** to `Schema` in `src/constants/types.ts`

    ```typescript
    export enum Schema {
    	PRODUCT_CATALOG = 'productCatalog', // NEW
    }
    ```

2. **Define response type** in `SchemaToResponse`:

    ```typescript
    export type SchemaToResponse = {
    	[Schema.PRODUCT_CATALOG]: Product[]; // Map schema → response type
    };
    ```

3. **Register datasource** in `src/constants/dataSources.ts`:

    ```typescript
    export const dataSources: DataSources = {
    	productCatalog: {
    		BASE_URL: 'https://api.example.com/products',
    		schema: Schema.PRODUCT_CATALOG,
    		queryParams: { page: 1, limit: 20 },
    		timeout: 3000,
    		options: { method: 'GET' },
    		reducer: productCatalogReducer, // Ref step 4
    	},
    };
    ```

4. **Create reducer** in `src/reducers/productCatalogReducer.ts`:

    ```typescript
    import { ActionType, InitialState, Action } from '../constants/types';

    export default function productCatalogReducer(
    	state: InitialState,
    	action: Action,
    ): InitialState {
    	switch (action.type) {
    		case ActionType.FETCH_SUCCESS:
    			return { ...state, isLoading: false, data: action.payload, isError: false };
    		case ActionType.FETCH_FAILURE:
    			return { ...state, isLoading: false, isError: true };
    		// Handle other actions...
    		default:
    			return state;
    	}
    }
    ```

5. **Use in component:**
    ```typescript
    const { data: products } = useFetch<Schema.PRODUCT_CATALOG>(Schema.PRODUCT_CATALOG);
    ```

### Worker Queue: Request Deduplication & Fallback

```typescript
// Same URL + options = 1 network call (even if called 5x)
WorkerQueue.getInstance().fetchAPIData(url, options);

// Force bypass deduplication:
useFetch(schema, { force: true });

// Worker unavailable? Falls back to main thread automatically
// No manual fallback code needed - WorkerQueue handles it
```

### Reducer Pattern (Standard State Shape)

```typescript
interface InitialState {
	isLoading?: boolean;
	isError?: boolean;
	isUpdating?: boolean;
	data?: APIDataTypes; // Normalized response
	currentPage?: number;
	TOTAL_PAGES?: number;
	// Add domain-specific fields as needed
}
```

All reducers follow this contract; dispatch actions via `useFetch()` methods.

### Socket.io Real-Time Communication

**Server** (`server/src/socketConnection.ts`):

```typescript
io.on('connection', (socket: Socket) => {
	socket.on('message', (data) => io.emit('broadcast', data)); // Broadcast to clients
	socket.on('disconnect', () => {
		/* cleanup */
	});
});
```

**Client** (`src/hooks/useSocketConnection.ts`):

```typescript
const { socket, connectionStatus } = useSocketConnection(() => {
	console.log('Connected'); // Optional callback
});

socket?.on('broadcast', (data) => {
	/* handle */
});
socket?.emit('message', payload);

// Automatic reconnection: 3 attempts @ 2s delay
// Transports: WebSocket preferred, polling fallback
```

## Build & Development Commands

| Command             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `yarn dev`          | Nodemon watches server + client, HMR enabled |
| `yarn dev:server`   | TypeScript server only via `tsx watch`       |
| `yarn dev:hmr`      | Webpack dev server on port 3100 with HMR     |
| `yarn build:make`   | Production client bundle via `make/make.js`  |
| `yarn build:server` | TypeScript server compile to JS              |
| `yarn test`         | Jest unit tests                              |
| `yarn test:e2e`     | Playwright end-to-end tests (headless)       |
| `yarn test:headed`  | Playwright with browser UI                   |
| `yarn lint:js`      | ESLint on TS/JS/TSX/JSX/HBS files            |
| `yarn lint:fix`     | Auto-fix linting issues                      |

**TypeScript config** (`tsconfig.json`):

- Target: `esnext`
- JSX: `react-jsx` (React 19)
- Strict mode enabled
- Source maps enabled for debugging

## Backend Architecture Patterns

### Global Error Handling Middleware

Express routes are auto-wrapped with async error handling (`server/src/globalErrorHandler.ts`):

```typescript
// Define routes normally; errors automatically flow to global handler
router.post('/api/data', async (req, res) => {
	throw new Error('Something broke'); // Caught by middleware
});
```

**No try-catch boilerplate needed** - the framework wraps all route handlers.

### Logging with Winston

Consistent logging across backend with file rotation and line number tracking:

```typescript
import { logger } from './Logger';

logger.info('Server started');
logger.error('Database connection failed', { errno: 5432 });
// Output: `2026-01-18 10:30:45 error: message (line 42) {...meta}`
```

Logs written to `error.log` and `combined.log` in project root.

### Chat/LLM Integration (OpenAI/Ollama Pattern)

Both OpenAI and local Ollama are supported via `server/src/routes/chat.ts`:

```typescript
// OpenAI (429 quota errors are billing/account issues, not code bugs)
const response = await fetch('https://api.openai.com/v1/chat/completions', {
	/* ... */
});

// Local Ollama fallback
const response = await fetch('http://localhost:11434/api/chat', {
	/* ... */
});

// Error handling: Check status codes (401=auth, 429=quota, 503=service down)
if (err?.status === 429) {
	res.status(429).json({ error: 'API quota exceeded. Check billing.' });
}
```

**Critical:** OpenAI 429 errors mean the API key/account has no credits - check [platform.openai.com/account/billing](https://platform.openai.com/account/billing).

## File Structure

```
src/
  hooks/              # Custom hooks - useFetch, useSocket, useActionState, useAsync, etc.
  components/         # React components organized by feature + Common/ for reusables
  reducers/           # State reducers per schema (infiniteScrollReducer.ts, etc.)
  constants/          # Schema enum, ActionType, types, dataSources registry
  workers/            # Web Worker code (MyWorker.worker.ts) + WorkerQueue singleton
  services/           # APIService, ImageService (used in workers)
  store/              # Zustand/Redux store configurations
  utils/              # Utilities: Logger, typeChecking, common, AsyncUtil
  Context/            # React Context providers
  HOCs/               # ConnectDataFetch wrapper
  types/              # TypeScript interfaces for API responses (separate from constants/types.ts)

server/src/
  routes/             # Express route handlers (chat.ts, auth routes, etc.)
  controllers/        # Business logic (authController.ts)
  services/           # UserService, tokenService, hashService
  dbClients/          # Database connection managers
  graphql/            # GraphQL resolvers
  middlewares/        # Express middlewares
  models/             # Data models/schemas (DB or GraphQL)
  socketConnection.ts # Socket.io server setup
  Logger.ts           # Winston logger instance
  globalErrorHandler.ts # Auto-wraps routes with error handling
  index.ts            # Server entry point
```

## Testing Patterns

**Unit Tests** (`src/hooks/__tests__/useFetch.test.ts`):

```typescript
// Mock WorkerQueue
jest.spyOn(workerManager, 'fetchAPIData').mockResolvedValue({ success: true, data: [...] });

// Render hook and test
const { result } = renderHook(() => useFetch(Schema.MOVIE_LIST));
await act(() => result.current.fetchData());
expect(result.current.data).toEqual([...]);
```

**E2E Tests** (`playwright.config.ts`):

- Run with `yarn test:e2e` (headless) or `yarn test:headed` (UI)
- Tests in `tests/` directory

## Critical Developer Workflows

### Debugging Data Fetches

1. Check `WorkerQueue.getInstance()` initialized in browser console
2. Verify schema exists in `Schema` enum + maps to response type in `SchemaToResponse`
3. Confirm datasource registered: `constants.dataSources[Schema.YOUR_SCHEMA]`
4. Inspect network tab: should see 1 request (deduplication working) or many (force: true)
5. Check `WorkerQueue` telemetry via `getTelemetrySubscribers()` for timing/errors

### Adding API Endpoints (Backend)

1. Define route in `server/src/routes/` (e.g., `products.ts`)
2. Register in `server/src/app.ts`: `app.use('/api/products', productRoutes)`
3. All errors auto-caught by globalErrorHandler
4. Return JSON; let middleware handle logging/status codes

### API Response Shape Mismatch

If component gets wrong data shape:

1. Check API endpoint returns expected shape
2. Verify `transformResponse` in useFetch normalizes correctly
3. Confirm reducer handles `ActionType.FETCH_SUCCESS` with transformed data
4. TypeScript: `SchemaToResponse[Schema.YOUR_SCHEMA]` should match reducer's output type

### Handling Concurrent Requests

WorkerQueue automatically deduplicates identical URL+options requests:

```typescript
// These 5 calls = 1 network request
useFetch(Schema.MOVIE_LIST).fetchData(); // Call 1
useFetch(Schema.MOVIE_LIST).fetchData(); // Calls 2-5 wait for result of Call 1
```

To bypass deduplication: `useFetch(schema, { force: true })`

Test via mock call counts: `expect(workerManager.fetchAPIData).toHaveBeenCalledTimes(1);`

## External Dependencies & Integrations

- **React 19** + **React Router v7** for navigation
- **Redux Toolkit + Redux** (coexists with schema system)
- **Zustand** for simpler store scenarios
- **Apollo Client** for GraphQL
- **Socket.io** for real-time updates
- **Tailwind CSS + tailwind-merge** for styling
- **Express** backend with Winston logging, Helmet security
- **Playwright** (E2E), **Jest** (unit tests), **Vitest** (alternative)

## Project-Specific Conventions to Follow

- **Named exports:** Use `export { Component }`, not `export default`; index files re-export for cleaner imports
- **Error handling:** Check `response.success` before accessing `response.data`; HTTPError includes status codes
- **Logging:** Use `createLogger('module-name')` for consistent output with line numbers
- **Loading states:** Disable form inputs during pending requests to prevent duplicate submissions
- **AbortError:** `useFetch` ignores AbortError (from component unmount); catches real errors only
- **Avoid direct Redux state mutation:** Always dispatch actions; let reducers transform state
- **Type safety:** Leverage `Schema` enum + `SchemaToResponse` for compile-time validation
- **Worker fallback:** No manual fallback code; `WorkerQueue` handles it automatically
