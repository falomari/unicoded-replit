---
name: Stripe credentials across runtimes
description: Replit’s managed Stripe connection and Vercel serverless functions use different credential paths.
---

Keep the Stripe secret server-side in both runtimes: Replit can use the managed connection, while Vercel needs an explicitly configured `STRIPE_SECRET_KEY` environment variable.

**Why:** Connecting Stripe in Replit did not populate the separately named secret expected by the Vercel-compatible function.

**How to apply:** Never expose either credential to the browser; configure the Vercel secret independently when publishing outside Replit.