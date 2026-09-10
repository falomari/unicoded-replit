---
name: Stripe test currency availability
description: The connected Stripe Test Mode account may reject currencies even when Stripe supports them globally.
---

Use a currency returned as supported by the connected Stripe account when creating Checkout sessions; global Stripe currency support is not enough.

**Why:** The connected Test Mode account rejected KWD while accepting AED, causing Checkout session creation to fail until the catalog currency matched the account.

**How to apply:** When changing catalog currency, run one harmless Checkout session check through the app endpoint before presenting the payment flow as ready.