# Changelog

## 0.0.0

- Initialized the repo
- Set up linters, formatters, build configs, styles, and testing
- Created folder structure
- Added initial UserInfo page, routing, and theme configuration
- Added Valtio state management with order store
- Added Axios configuration and TanStack Query data fetching for user info and orders
- Added custom theme overrides, responsive layout, Header, NavBar, accessible SearchBar with React Hook Form, and axe-core accessibility tests
- Added application and layout ErrorBoundary handling, ErrorFallback UI, error logging helper, and enhanced search validation messages
- Added 3-level ErrorBoundary isolation, throwOnError for 5xx API errors, and granular retry alerts for independent UserInfo sections
- Implemented full Figma dashboard UI and real backend integration:
  - Removed unused auth/logout/token/password placeholders since backend has no auth layer
  - Added full CRUD detail pages: `/orders/:id` (`OrderDetails`), `/products/:id` (`ProductDetails`), `/users` (`Users`), and `/users/:id` (`UserDetails`)
  - Updated `OrderForm`, `OrdersTable`, `Actions`, `Products`, and `Settings` to perform real API mutations and invalidate TanStack Query caches
- Expanded Vitest unit/integration suite (`utils`, `UserInfo.State`, hooks, router/ErrorBoundary, detail & directory pages), configured `@vitest/coverage-v8` (`pnpm test:coverage`), and added Playwright E2E tests (`pnpm test:e2e`)
