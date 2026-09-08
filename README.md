<div align="center">
  <img src="https://via.placeholder.com/150x150/1A1A1A/D4AF37?text=PJ+Lawn" alt="PJ Lawn Logo" width="120" />
  <h1>PJ Lawn Official Website</h1>
  <p><strong>Premium Event Venue Booking Platform</strong></p>
  
  [![Live Demo](https://img.shields.io/badge/Live_Website-pjlawn.netlify.app-D4AF37?style=for-the-badge)](https://pjlawn.netlify.app/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)]()
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)]()
  [![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)]()
</div>

<br />

## 🌟 Overview

PJ Lawn is a high-end, commercial event venue booking platform. Designed with a premium dark-mode aesthetic and gold accents, it provides a seamless and luxurious user experience for customers looking to book weddings, corporate events, and parties.

The platform handles everything from availability checks and interactive date selection to secure authentication, admin approvals, and advance payment collection via Cashfree.

---

## 🚀 Tech Stack

### Frontend Architecture
- **Framework:** React 18 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animations:** Framer Motion & Lenis (Smooth Scrolling)
- **Routing:** React Router v6
- **Forms & Validation:** React Hook Form + Zod
- **Date Management:** date-fns + react-day-picker

### Backend & Infrastructure
- **Hosting & Serverless:** Netlify (Edge CDN & Serverless Functions)
- **Authentication:** Firebase Auth (Google OAuth) + Custom Claims
- **Database:** Firebase Firestore (Real-time NoSQL)
- **Payment Gateway:** Cashfree Payments (`@cashfreepayments/cashfree-js` & `cashfree-pg`)

---

## ⚙️ Core Features & Workflows

### 1. High-Conversion Booking Flow
Instead of forcing users to create an account upfront, the platform uses a **frictionless booking flow**:
- Users browse amenities, view the gallery, and select a date using a custom-styled interactive calendar.
- They fill out their event details (guest count, event type, etc.).
- **Authentication:** Only at the final review step are they prompted to securely log in via Google Sign-In. This maximizes conversion rates.
- A Firestore document is instantly created with a `pending` status.

### 2. Secure Admin Dashboard & Custom Claims
- The platform features a hidden `/admin` dashboard.
- **Security:** Access is strictly controlled via Firebase Custom Claims (`admin: true`). Unauthenticated or standard users are instantly redirected.
- **Workflow:** The venue owner logs in, views pending bookings, negotiates off-platform if necessary, and inputs the final agreed-upon base price, marking the booking as `approved`.

### 3. Bank-Grade Cashfree Payment Architecture (Rebuilt from Scratch)
To ensure the highest level of security, integrity, and fault-tolerance, the payment pipeline is built on Cashfree API version `2025-01-01` and SDK `cashfree-pg` v6:
- **Server-Side Order Authorization:** When a user initiates payment on their dashboard (`advance`, `remaining`, or `full`), `/netlify/functions/create-cashfree-order` queries Firestore to verify price integrity and status before generating a Cashfree `payment_session_id`. Client amounts cannot be spoofed.
- **Drop-in Modal Web Checkout:** The frontend uses `@cashfreepayments/cashfree-js` initialized via singleton pattern with complete 3-state Promise handling (`result.error`, `result.redirect`, `result.paymentDetails`).
- **Authoritative Gateway Verification:** `/netlify/functions/verify-cashfree-payment` calls Cashfree's authoritative `PGFetchOrder` and `PGOrderFetchPayments` endpoints before updating Firestore or dispatching receipts.
- **Cryptographic Asynchronous Webhooks:** Real-time event pipeline `/netlify/functions/cashfree-webhook` validates `x-webhook-signature` using constant-time HMAC-SHA256 (`crypto.timingSafeEqual`) on the raw payload, processing `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`, and abandonment events with full idempotency.
- **Automated Customer Receipts:** Sends branded transactional HTML receipts via Resend upon successful payment verification.

### 4. High-Performance Photo Gallery (Images 1–11)
- Venue showcase features 11 curated high-definition photographs covering the evening lighted lawn, dining & buffet areas, stage setups, grand entrance, and suites.
- Built-in compression pipeline (`scripts/compress-gallery.js` using `sharp`) compresses raw multi-megabyte photos into progressive `.webp` format, slashing asset payloads by ~85% for instant mobile loading.
- Features smooth masonry display and responsive Embla carousel lightbox.

---

## 🤖 AI & Tooling Efficiency

This project was built incredibly fast and efficiently using advanced AI agent workflows:

- **Antigravity IDE:** Utilized for end-to-end full-stack generation, capable of writing, executing, and debugging code directly in the workspace.
- **MCP (Model Context Protocol):** 
  - Integrated the **GitHub MCP Server** locally to autonomously manage repositories, avoiding context switching.
  - Leveraged the **Firebase MCP Server** to manage cloud infrastructure seamlessly.
- **Specialized Skills:** Utilized custom agent skills (`ui-ux-pro-max`, `cashfree-skills`) to ensure the design met premium standards and the payment integration adhered strictly to the gateway's security guidelines.

---

## 🛠️ Local Development

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root directory and populate it with your Firebase and Cashfree keys (refer to `.env.example`).

3. **Run the Development Server:**
   *Note: To test Cashfree integrations locally, you must run the Netlify dev server so the serverless functions are accessible.*
   ```bash
   npm run dev:netlify
   ```

## 🔒 Security Notes
- `CASHFREE_SECRET_KEY` and `ADMIN_SECRET` must only live in production Environment Variables.
- Firestore Security Rules restrict `update` and `delete` operations to admins only, while users can only read their own documents.

<div align="center">
  <p>Built with ❤️ for PJ Lawn</p>
</div>
