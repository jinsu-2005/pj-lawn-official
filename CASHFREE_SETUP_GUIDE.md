# PJ Lawn - Cashfree Payment Gateway Setup Guide

This guide contains everything you need to configure Cashfree Payments for the PJ Lawn application from scratch.

## 1. Cashfree Dashboard Setup

1. **Create an Account**: Sign up at [Cashfree Payments](https://www.cashfree.com/).
2. **Access the Sandbox (Test Environment)**:
   - Go to **Payment Gateway** > **Sandbox**.
   - Navigate to **Developers** > **API Keys**.
   - Click **Generate API Keys**.
   - Copy your **App ID** and **Secret Key**.
3. **Configure Webhooks**:
   - In the Cashfree dashboard, go to **Developers** > **Webhooks**.
   - Click **Add Webhook**.
   - **Endpoint URL**: `https://YOUR_NETLIFY_SITE_URL.netlify.app/.netlify/functions/cashfree-webhook`
   - **Events to Select**:
     - `PAYMENT_SUCCESS_WEBHOOK`
     - `PAYMENT_FAILED_WEBHOOK`
   - Generate a **Webhook Secret** (if prompted) and save it.
4. **Production (Go-Live)**:
   - Once testing is done, switch to the **Production** environment.
   - Generate new API Keys for Production.
   - Whitelist your domain (`https://pjlawn.netlify.app`) in the Cashfree Production dashboard.
   - Update your Netlify environment variables with the Production keys.

## 2. Firebase Setup (Admin Credentials)

To allow the Netlify backend functions to securely update payment statuses in Firestore, you must provide a Service Account Key.

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (`pj-lawn`).
3. Click the **Gear Icon** (Project Settings) > **Service Accounts**.
4. Click **Generate new private key**.
5. A JSON file will download to your computer. Open it and copy the entire contents.

## 3. Local Development (`.env` file)

In the root of the `PJ Lawn` folder, ensure your `.env` file contains the following variables. Do NOT commit this file to GitHub.

```env
# Cashfree Credentials
CASHFREE_ENV=sandbox
CASHFREE_APP_ID=your_test_app_id
CASHFREE_SECRET_KEY=your_test_secret_key
CASHFREE_WEBHOOK_SECRET=your_test_webhook_secret # (Uses SECRET_KEY if omitted)

# Firebase Admin Credentials
FIREBASE_SERVICE_ACCOUNT_KEY='{ "type": "service_account", "project_id": "pj-lawn", ... }'
```

*Note: For the Service Account Key, paste the entire JSON object on a single line wrapped in single quotes.*

## 4. Netlify Production Configuration

When deploying the site, you must add these identical environment variables to Netlify so the production server can process payments.

1. Go to your [Netlify Dashboard](https://app.netlify.com/).
2. Select your site > **Site configuration** > **Environment variables**.
3. Add the following variables:
   - `CASHFREE_ENV` (Set to `production` when going live)
   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
   - `CASHFREE_WEBHOOK_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT_KEY`

*Important: Do not forget to trigger a new deploy in Netlify after adding or changing environment variables.*

## 5. Understanding the Code Flow

- **Frontend (`src/pages/Dashboard.tsx`)**:
  - When the user clicks "Pay Advance", it sends a request to `/.netlify/functions/create-cashfree-order`.
  - The frontend receives a `payment_session_id`.
  - The Cashfree JS SDK (`cashfree.checkout`) opens a secure modal using `redirectTarget: '_modal'`.
  
- **Order Creation (`netlify/functions/create-cashfree-order.ts`)**:
  - Validates the booking amount.
  - Generates a unique order ID.
  - Communicates with Cashfree via the backend SDK to retrieve a payment session.

- **Payment Verification (`netlify/functions/verify-cashfree-payment.ts`)**:
  - Once the frontend modal closes successfully, it pings this endpoint.
  - The endpoint securely verifies the `order_id` with Cashfree.
  - If paid, it uses the **Firebase Admin SDK** to update Firestore `paymentStatus` to `advance_paid` and `bookingStatus` to `confirmed`.
  - It triggers an email receipt via Resend.

- **Webhook Handler (`netlify/functions/cashfree-webhook.ts`)**:
  - Listens for asynchronous payment events from Cashfree (useful if the user closes their browser before the frontend verification finishes).
  - Validates the webhook signature using your Webhook Secret / Secret Key.
  - Updates Firestore similarly to the verification endpoint.
