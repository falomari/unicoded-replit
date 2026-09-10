# عبق — متجر العطور العربية

متجر عربي خفيف ومتجاوب لعرض العطور العربية وإتمام الطلبات عبر Stripe Checkout في وضع الاختبار.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/abq-store run dev` — run the Arabic storefront
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, reserved for the orders bonus)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Arabic RTL, Cairo / Playfair Display typography
- Payments: Stripe Checkout Test Mode through the Replit-managed Stripe connection

## Where things live

- `artifacts/abq-store/src/App.tsx` — storefront, cart, success and cancel routes
- `artifacts/abq-store/src/index.css` — visual system and responsive RTL styling
- `artifacts/api-server/src/routes/storefront.ts` — catalog and server-owned Checkout session creation
- `api/_catalog.ts`, `api/products.ts`, `api/checkout-session.ts` — Vercel serverless equivalents
- `vercel.json` — Vercel build configuration
- `lib/api-spec/openapi.yaml` — source of truth for products and checkout contracts

## Architecture decisions

- Product prices are validated against the server catalog before Checkout; the browser never chooses arbitrary amounts.
- Stripe Checkout is hosted by Stripe; the frontend redirects to the returned session URL and never receives the server credential.
- The current Test Mode account accepts AED for Checkout, so demo prices are stored in minor units for AED.
- Vercel uses `STRIPE_SECRET_KEY` in its serverless function; Replit uses the managed Stripe connection for the same server-side operation.
- Orders, webhooks, and database persistence are intentionally deferred to the proposed Bonus task.

## Product

Users can browse six Arabic fragrance demos, add and remove items, change quantities up to ten per item, see a live total, and start a Stripe Test Mode payment. Success and cancellation routes are included.

## User preferences

- Keep the storefront entirely Arabic and RTL.
- Do not add Login, MongoDB, or an Admin Dashboard unless the user asks.
- Prefer a small dependency surface and lightweight interactions to conserve Replit Credits.

## Gotchas

- If the OpenAPI contract changes, run `pnpm --filter @workspace/api-spec run codegen` before typechecking the frontend.
- Stripe Test Mode currency availability belongs to the connected account; verify a currency before changing the catalog.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
