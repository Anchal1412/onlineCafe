# Payment Service

This service provides payment order creation and webhook handling. It supports Razorpay when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are provided; Stripe is still present for compatibility. Without keys the service runs in a mock mode for local development.

Quick start

1. Install dependencies:

```bash
cd paymentService
npm install
```

2. Copy `.env.example` to `.env` and set values (set Razorpay keys for production)

3. Run in development:

```bash
npm run dev
```

HTTP endpoints

-- `POST /api/payments/create-order` { amount, currency?, receipt?, notes? } -> creates Razorpay order (returns `orderId` and `key`)
- `POST /api/payments/create-intent` -> alias for `create-order` for backward compatibility
- `GET  /api/payments/:id` -> get payment record
- `POST /webhook` -> webhook endpoint (raw body required). For Razorpay signature verification, set `RAZORPAY_WEBHOOK_SECRET`.

Notes

When using Razorpay, set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
Payments are stored in `payments.json` for simplicity; replace with a DB in production.
