# Ally-Test: AI Development Guidelines

This is a React + TypeScript framework built on a custom architecture emphasizing worker-based async operations, schema-based state management, and declarative component patterns.

## Architecture Overview

### Core Pillars

**1. Web Worker-Based Data Fetching**

- All API calls offload to `WorkerQueue` singleton (`src/workers/WorkerQueue.ts`)
- Main thread stays responsive; heavy operations (fetch, image loading) run in workers
- Worker communicates via message passing with automatic request deduplication
- **Entry point:** Use `useFetch` hook which internally delegates to `WorkerQueue.fetchAPIData()`

**2. Schema-Based State Management**

- Define schemas in `src/constants/types.ts` (enum `Schema`)
- Map each schema to expected response type in `SchemaToResponse` type
- Reducers in `src/reducers/` handle type-specific state transformations
- **Pattern:** Schema + Reducer = complete data pipeline; no boilerplate Redux needed

**3. Form Generation from JSON**

- `src/components/Common/FormGenerator/` renders forms declaratively from JSON config
- Eliminates form markup changes without code deployment
- JSON can flow from APIs for dynamic form structures

**4. ConnectDataFetch HOC**

- Wraps components to inject fetched data and dispatch actions
- Located in `src/HOCs/ConnectDataFetch.tsx`
- Combines `mapStateToProps`/`mapDispatchToProps` patterns

## Key Patterns & Conventions

### Using `useFetch` Hook

```typescript
// In src/hooks/useFetch/index.ts - the primary data fetching interface
const { data, fetchData, fetchNextPage, updateData, refetch, isStale } = useFetch<Schema>(
  Schema.INFINITE_SCROLL, // Typed schema
  {
    timeout: 3000,
    staleTime: 5000,                    // SWR-like caching
    refetchOnWindowFocus: true,         // Auto-refetch when tab regains focus
    refetchInterval: 0,                 // Polling disabled by default
    transformResponse: (raw) => raw.items, // Transform API response
    onSuccess: (data) => {},            // Callbacks
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** (attempt - 1), 30000), // Exponential backoff
    worker: injectedWorker,             // Dependency injection for tests
    updateCache: (old, updated) => [...old, updated], // Local optimistic updates
  }
);

// Always call fetchData explicitly (not auto-called)
await fetchData();
await fetchNextPage(2);
await updateData({ method: 'POST', body: JSON.stringify({...}) });
```

**Critical:** Refs like `fetchDataRef` wrap mutable functions to maintain stable hook dependencies. Window/document event listeners use these refs to avoid re-attaching handlers.

### Adding New Data Schema

1. Add enum value to `Schema` in `src/constants/types.ts`
2. Map schema to response type in `SchemaToResponse`
3. Create reducer in `src/reducers/` handling `ActionType.FETCH_SUCCESS`, `.FETCH_FAILURE`, etc.
4. Register in `src/constants/` datasources with API endpoint and headers
5. Use in components via `useFetch<YourSchema>(Schema.YOUR_SCHEMA)`

### Worker Queue Integration

- **Singleton pattern:** `WorkerQueue.getInstance()` - one instance per app
- **Request deduplication:** Same URL + options = single network call even if called multiple times
- **Fallback:** If worker unavailable, executes in main thread via `executeInMainThread()`
- **Public API:** `fetchAPIData()`, `loadImages()`, `loadImage()`, `startCurrencyStream()`

### Reducer Pattern

```typescript
// src/reducers/dataFetchReducer.ts - generic pattern
const state = { isLoading, isError, data, currentPage, ... }
// Action dispatches update state per schema
// Custom reducers extend this pattern (infiniteScrollReducer, movieListReducer, etc.)
```

## Build & Development

| Command           | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `yarn dev`        | Nodemon watches & restarts on changes     |
| `yarn build:make` | Webpack bundles client via `make/make.js` |
| `yarn dev:hmr`    | Webpack dev server with HMR on port 3100  |
| `yarn test`       | Jest test suite                           |
| `yarn test:e2e`   | Playwright end-to-end tests               |
| `yarn lint:js`    | ESLint on TS/JS/TSX/JSX/HBS               |
| `yarn lint:fix`   | Auto-fix lint issues                      |

**TypeScript config** (`tsconfig.json`):

- Target: `esnext`
- JSX: `react-jsx` (React 19)
- Strict mode enabled
- Source maps enabled for debugging

## File Structure

```
src/
  hooks/              # Custom hooks - useFetch, useDataApi, useActionState, etc.
  components/         # React components - demos + reusable (Common/)
  reducers/           # State shape transformers per schema
  constants/types.ts  # Schema enum, action types, core type definitions
  workers/            # WebWorker code (MyWorker.worker.ts) + WorkerQueue manager
  store/              # Zustand/Redux store configs
  services/           # APIService, ImageService (used in workers)
  utils/              # Utilities: typeChecking, common, AsyncUtil
  Context/            # React Context providers (dataFetchContext)
  HOCs/               # ConnectDataFetch wrapper
server/src/           # Express backend with GraphQL, Socket.io, DB clients
tests/                # Test utilities
make/                 # Webpack build orchestration
```

## Testing Patterns

- **Unit tests** mock `WorkerQueue` via `jest.spyOn(workerManager, 'fetchAPIData')`
- **Hook tests** use `@testing-library/react-hooks` `renderHook` + `act`
- **Mock implementation:** Return promises with configurable delays to test timing/race conditions
- See `src/hooks/__tests__/useFetch.test.ts` for comprehensive examples

## Critical Developer Workflows

### Debugging Data Fetches

1. Check `WorkerQueue.getInstance()` is initialized
2. Verify schema exists in `Schema` enum + `SchemaToResponse`
3. Confirm datasource registered in `constants.dataSources[schema]`
4. Use `withTimeout()` utility for timeout handling
5. Inspect worker messages in DevTools: worker logs via `Logger` utility

### Adding API Endpoints

1. Register in `constants/dataSources` with base URL + query params
2. Create schema in types if needed
3. Hook up reducer to handle response shape
4. Call `useFetch(schema)` in component

### Handling Concurrent Requests

- `WorkerQueue` deduplicates identical requests automatically
- Use `force: true` in fetch options to bypass deduplication
- Race conditions tested in `useFetch.test.ts` - verify via `fetchAPIData` call counts

## External Dependencies

- **React 19** + **React Router v7** for navigation
- **Redux Toolkit + Redux** (coexists with custom schema system)
- **Zustand** for simpler store scenarios
- **Apollo Client** for GraphQL
- **Socket.io** for real-time communication
- **Tailwind CSS** for styling + `tailwind-merge` for class merging
- **Express** backend with GraphQL HTTP, Winston logging, Helmet security
- **Playwright** for E2E tests, **Jest** for unit tests

## Conventions to Follow

- **Exports:** Use named exports; index.ts re-exports for cleaner imports
- **Error handling:** `handleError()` in useFetch checks `error.name !== 'AbortError'`
- **Refs for stable dependencies:** `useRef` wraps mutable callback functions to stabilize hook dependencies
- **Type safety:** Leverage `Schema` enum for compile-time schema validation
- **Avoid:** Directly modifying Redux state; dispatch actions only
- **Logging:** Use `createLogger('module-name')` utility for consistent logging

---

**Last Updated:** January 2026 | **For questions:** Refer to README.md and codebase examples in `src/hooks/__tests__/` and `src/components/`
