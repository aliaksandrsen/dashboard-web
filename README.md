# Dashboard UI (`TestsTore`)

Full-stack React + TypeScript admin dashboard connected to the NestJS backend (`dashboard-server`).

## How to run locally

1. Ensure `.env` has `VITE_API_URL=http://localhost:3000` (matching `dashboard-server`).
2. Install dependencies and start the dev server:

- `pnpm install`
- `pnpm dev`

The app runs on `http://localhost:8080/`.

## Docker (Chapter 26)

Build and run the containerized frontend on `http://localhost:8080/`:

- `docker build . -t "dashboard-ui:v1.0"`
- `docker run -d -p 8080:8080 dashboard-ui:v1.0`

## Scripts

- `pnpm test` — run Vitest + Testing Library + `axe-core` accessibility tests
- `pnpm test:coverage` — run Vitest suite with V8 coverage report (`coverage/`)
- `pnpm test:e2e` — run Playwright end-to-end tests (`e2e/`, requires `dashboard-server` running on `http://localhost:3000`)
- `pnpm lint` — run Oxlint static checks
- `pnpm format` / `pnpm format:check` — format or verify formatting with Oxfmt
- `pnpm build` — type-check with `tsc -b` and build production bundle with Vite

## Implemented Screens & Routing

- **`/` (`Dashboard`)**: Real 30-day order count, total revenue, product & customer counts, recent orders and catalog previews, and Stripe Checkout return banners (`?success=true` / `?canceled=true`).
- **`/orders`, `/orders/new`, `/orders/:id`, `/orders/:id/edit`**: Full-width orders table with top search/customer/source filter toolbar, dedicated create/view/edit pages, explicit nullable unassign/invoice clearing, and confirmation dialogs for deletion.
- **`/products`, `/products/new`, `/products/:id`, `/products/:id/edit`**: Full-width catalog with top debounced search toolbar, dedicated create/view/edit pages, and product-level Stripe Checkout (`POST /v1/stripe/payments`) with automatic `stripePriceId` pre-fill.
- **`/users`, `/users/new`, `/users/:id`, `/users/:id/edit`**: Full-width customers directory with top debounced search toolbar, dedicated create/view/edit pages, customer orders history, and quick order creation (`/orders/new?userId=:id`).
- **`/settings`**: Stripe Orders background synchronization (`POST /v1/jobs/sync-stripe`) with schedule info and sync metrics.
- **`*` (`NotFound`)**: Dedicated 404 fallback page with navigation back to Dashboard/Orders (`/actions` redirects to `/orders`).
