import React, { createContext } from 'react';
import { renderHook } from '@testing-library/react-hooks';

import useContextFactory from '../useContextFactory';
import { createContextProvider } from '../contextProviderFactory';
import { createAsyncContext, useAsyncFactory } from '../AsyncFactoryContext';
import { createAuthContext, useAuth } from '../AuthProvider';
import { createThemeContext, useTheme } from '../ThemeProvider';
import { createSecurityContext, useSecurityContext } from '../SecurityContext';

describe('useContextFactory', () => {
	it('should return context value when context is provided', () => {
		const TestContext = createContext<string | undefined>('test-value');
		const useTestContext = useContextFactory('TestContext', TestContext);

		const { result } = renderHook(() => useTestContext());

		expect(result.current).toBe('test-value');
	});

	it('should throw an error when context is not provided', () => {
		const TestContext = createContext<string | undefined>(undefined);
		const useTestContext = useContextFactory('TestContext', TestContext);

		const { result } = renderHook(() => useTestContext());

		expect(result.error).toEqual(
			new Error('useContext must be used within a TestContext'),
		);
	});

	it('should create an explicit provider and hook factory', () => {
		const TestContext = createContext<{ value: string } | undefined>({ value: 'initial' });
		const [Provider, useTestContext] = createContextProvider(
			TestContext,
			'TestContext.Provider',
		);

		const { result } = renderHook(() => useTestContext(), {
			wrapper: ({ children }: { children: React.ReactNode }) =>
				React.createElement(Provider, { value: { value: 'updated' } }, children),
		});

		expect(result.current).toEqual({ value: 'updated' });
	});

	it('should create explicit async and auth context providers', () => {
		const [AsyncProvider, useAsyncContext] = createAsyncContext();
		const [AuthProvider, useAuthContext] = createAuthContext();

		const { result: asyncResult } = renderHook(() => useAsyncContext(), {
			wrapper: ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					AsyncProvider,
					{ value: { ready: true } as any },
					children,
				),
		});

		const { result: authResult } = renderHook(() => useAuthContext(), {
			wrapper: ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					AuthProvider,
					{
						value: {
							user: null,
							login: jest.fn(),
							logout: jest.fn(),
							isLoading: false,
						},
					},
					children,
				),
		});

		expect(asyncResult.current).toEqual({ ready: true });
		expect(authResult.current.isLoading).toBe(false);
	});

	it('should create explicit theme and security context providers', () => {
		const [ThemeProvider, useThemeContext] = createThemeContext();
		const [SecurityProvider, useSecurityContextInstance] = createSecurityContext();

		const { result: themeResult } = renderHook(() => useThemeContext(), {
			wrapper: ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					ThemeProvider,
					{ value: { theme: 'dark', toggleTheme: jest.fn(), isDark: true } },
					children,
				),
		});

		const { result: securityResult } = renderHook(() => useSecurityContextInstance(), {
			wrapper: ({ children }: { children: React.ReactNode }) =>
				React.createElement(
					SecurityProvider,
					{ value: { csrfToken: 'token-123' } },
					children,
				),
		});

		expect(themeResult.current.isDark).toBe(true);
		expect(securityResult.current.csrfToken).toBe('token-123');
	});
});
