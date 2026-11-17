# Dashboard UI (`TestsTore`)

Full-stack React + TypeScript dashboard frontend built from the _Full-Stack JavaScript Strategies_ Figma designs and connected to the NestJS backend (`dashboard-server`).

## How to run locally

1. Ensure `.env` has `VITE_API_URL=http://localhost:3000` (matching `dashboard-server`).
2. Install dependencies and start the dev server:

- `pnpm install`
- `pnpm dev`

The app runs on `http://localhost:5173/`.

## Scripts

- `pnpm test` — run Vitest + Testing Library + `axe-core` accessibility tests
- `pnpm lint` — run Oxlint static checks
- `pnpm format` / `pnpm format:check` — format or verify formatting with Oxfmt
- `pnpm build` — type-check with `tsc -b` and build production bundle with Vite

## Implemented Screens & Features

- **`/` (`UserInfo`)**: Header with product search, user info, and notifications popover; 30-day summary metric cards; `All orders` sortable, searchable, filterable, and paginated `OrdersTable`; `Recent orders` and `Related products` quick preview cards.
- **`/actions` (`Actions`)**: `Changes you can make` dashboard with recent order status updates (`PATCH /v1/orders/:id`) and cancellation (`DELETE /v1/orders/:id`), digital & beta product cards, user profile editing (`PATCH /v1/users/:id`), new order creation (`OrderForm` -> `POST /v1/orders`), and contact schedule selector.
- **`/products` (`Products`)**: Product catalog (`GET /v1/products`), search filtering, product creation (`POST /v1/products`), editing (`PATCH /v1/products/:id`), deletion (`DELETE /v1/products/:id`), Stripe Checkout launch (`POST /v1/stripe/payments`), and manual Stripe orders sync (`POST /v1/jobs/sync-stripe`).
- **`/settings` (`Settings`)**: Profile management, `dashboard_web_auth` Bearer token storage/logout handling, and manual Stripe sync trigger.
