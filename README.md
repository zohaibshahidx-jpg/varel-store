# VAREL — assignment prototype

Next.js storefront inspired by a photographic garment rail. The sample products and prices are illustrative. Reference images are third-party demonstration assets; obtain rights or replace before publishing commercially.

## Local development

Use Node 22, install dependencies with `npm install`, copy `.env.example` to `.env.local`, then `npm run dev`. Run tests with `npm test`.

## Google authentication

Create a free Supabase project, configure its Google provider using a Google OAuth client, set the Supabase URL and publishable key in `.env.local` and Vercel, and allow the local and deployed origins in Supabase Auth redirect URLs. The Google client redirect URI must match the callback shown in Supabase's provider settings. Do not put secrets in NEXT_PUBLIC variables. Sign-in and sign-out require this configuration.

## Stripe test checkout

Set `STRIPE_SECRET_KEY` to a Stripe test secret key (`sk_test_...`) and `NEXT_PUBLIC_SITE_URL` to the deployed site origin. Checkout uses server-side catalog prices and accepts only test keys. Never enter live keys. Use Stripe's test card numbers in its hosted checkout. The current prototype does not store orders or verify fulfillment with webhooks; a redirect alone does not prove payment. Add signed webhook verification and idempotent order handling before any live store.

## Scope

The rail animates photographic image layers, not simulated 3D cloth. Front and back views use separate reference photographs; color choices are illustrative filters animated as a vertical swap, not real variant photographs. Replace sample images with licensed product and variant photography. Bag state is held in memory. Google and Stripe need external account setup and must be tested end to end after configuration. Free Vercel Hobby is limited to personal, non-commercial use, and all free services have usage limits.

## Orders and verified payments

`db/orders.sql` documents the order table currently provisioned in Supabase. The `orders` table has RLS: authenticated users may read only their own orders; browser roles cannot write order or payment status. To run checkout, configure server-only `SUPABASE_SECRET_KEY`, `STRIPE_SECRET_KEY` (test key only), and `STRIPE_WEBHOOK_SECRET` in Vercel, together with the public Supabase values and `NEXT_PUBLIC_SITE_URL`. Never commit these values.

In Stripe test mode register `/api/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, and `checkout.session.expired`. Configure the signing secret for that exact endpoint. Checkout records a pending order and the signed webhook verifies the session ID, amount, currency, order reference, test mode, and payment status before marking it paid. Redirecting to the confirmation page does not confirm payment. Use `/orders` while signed in to check the status.

The project uses illustrative filtered product variants and borrowed reference photos. This is a sandbox demo and not ready for live sales or fulfillment. Google OAuth, test-mode keys, webhook delivery and end-to-end order verification must be configured and tested before completion.
