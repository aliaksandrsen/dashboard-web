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
- Implemented full Figma dashboard UI and backend integration:
  - Normalized NestJS backend payloads (`GET /v1/users`, `GET /v1/orders`, `GET /v1/products`) alongside unit-test fixtures
  - Added accessible, sortable, filterable, searchable, paginated `OrdersTable`
  - Added 30-day summary cards, `Recent orders`, and `Related products` sidebar cards on `/`
  - Added `OrderForm` (`POST /v1/orders`) and `/actions` page (`PATCH`/`DELETE /v1/orders/:id`, `PATCH /v1/users/:id`, digital & beta product cards, contact schedule widget)
  - Added `/products` catalog page (product CRUD, Stripe Checkout via `POST /v1/stripe/payments`, and Stripe sync via `POST /v1/jobs/sync-stripe`)
  - Added `/settings` account, session token, and job management page with lazy route loading
