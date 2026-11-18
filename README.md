# Dashboard UI (`TestsTore`)

Full-stack React + TypeScript dashboard frontend connected to the NestJS backend (`dashboard-server`).

## How to run locally

1. Ensure `.env` has `VITE_API_URL=http://localhost:3000` (matching `dashboard-server`).
2. Install dependencies and start the dev server:

- `pnpm install`
- `pnpm dev`

The app runs on `http://localhost:5173/`.

## Scripts

- `pnpm test` — run Vitest + Testing Library + `axe-core` accessibility tests
- `pnpm test:coverage` — run Vitest suite with V8 coverage report (`coverage/`)
- `pnpm test:e2e` — run Playwright end-to-end tests (`e2e/`, requires `dashboard-server` running on `http://localhost:3000`)
- `pnpm lint` — run Oxlint static checks
- `pnpm format` / `pnpm format:check` — format or verify formatting with Oxfmt
- `pnpm build` — type-check with `tsc -b` and build production bundle with Vite

## Implemented Screens & Features

- **`/` (`UserInfo`)**: Dashboard with 30-day metrics, sortable/filterable/searchable/paginated `OrdersTable` (with inline `Delete` and `Details` links), `Recent orders` and `Related products` sidebars linked to detail pages.
- **`/orders/:id` (`OrderDetails`)**: Full order view (`GET /v1/orders/:id`), edit customer/products/total/invoice (`PATCH /v1/orders/:id`), and delete order (`DELETE /v1/orders/:id`).
- **`/actions` (`Actions`)**: Quick management for recent orders, products, customers, Stripe orders sync (`POST /v1/jobs/sync-stripe`), profile editing, and real order creation (`OrderForm` -> `POST /v1/orders`).
- **`/products` (`Products`) & `/products/:id` (`ProductDetails`)**: Product catalog (`GET /v1/products`, `GET /v1/products/:id`), creation (`POST /v1/products`), editing (`PATCH /v1/products/:id`), deletion (`DELETE /v1/products/:id`), Stripe Checkout (`POST /v1/stripe/payments`), and Stripe sync (`POST /v1/jobs/sync-stripe`).
- **`/users` (`Users`) & `/users/:id` (`UserDetails`)**: Users directory (`GET /v1/users?search=...`), active user switching, creation (`POST /v1/users`), detail view with customer orders (`GET /v1/users/:id`), editing (`PATCH /v1/users/:id`), and deletion (`DELETE /v1/users/:id`).
- **`/settings` (`Settings`)**: Active user profile editing and background Stripe orders sync trigger.
