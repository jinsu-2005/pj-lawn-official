<div align="center">
  <img src="./public/assets/logo.png" alt="PJ Lawn Logo" width="100" onerror="this.src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200&auto=format&fit=crop&q=80'" style="border-radius: 50%; box-shadow: 0 0 25px rgba(201,168,76,0.35);" />
  
  <br />
  
  # PJ LAWN
  ### Premier Open-Air Luxury Event Venue & Automated Reservation Platform
  
  <p align="center">
    <strong>Nagercoil, Tamil Nadu, India</strong>
  </p>

  [![Live Platform](https://img.shields.io/badge/Live_Venue-pjlawn.netlify.app-D4AF37?style=for-the-badge&logo=google-chrome&logoColor=white)](https://pjlawn.netlify.app/)
  [![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript_6-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Firebase](https://img.shields.io/badge/Firebase_Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![Cashfree](https://img.shields.io/badge/Cashfree_PG_v6-008080?style=for-the-badge&logo=cashfree&logoColor=white)](https://www.cashfree.com/)
  [![AI Assisted](https://img.shields.io/badge/AI_Assisted_Development-Google_Antigravity-8A2BE2?style=for-the-badge&logo=google&logoColor=white)]()

</div>

<br />

---

## 📖 Table of Contents

- [🌟 Overview](#-overview)
- [🏛️ Design Philosophy & Aesthetics](#️-design-philosophy--aesthetics)
- [⚡ Tech Stack & Architecture](#-tech-stack--architecture)
- [✨ Core Features](#-core-features)
  - [1. Frictionless Booking Engine](#1-frictionless-booking-engine)
  - [2. Bank-Grade Cashfree Payment Architecture](#2-bank-grade-cashfree-payment-architecture)
  - [3. Client-Side Live PDF Receipt Generator](#3-client-side-live-pdf-receipt-generator)
  - [4. Centralized High-Performance Auth Engine](#4-centralized-high-performance-auth-engine)
  - [5. Administrative Suite & Custom Claims Control](#5-administrative-suite--custom-claims-control)
  - [6. AI Venue Concierge](#6-ai-venue-concierge)
  - [7. Production Performance & Optimization](#7-production-performance--optimization)
- [🤖 AI-Assisted Development](#-ai-assisted-development)
- [📁 Directory Architecture](#-directory-architecture)
- [🚀 Local Development Setup](#-local-development-setup)
- [🔐 Security & Data Integrity](#-security--data-integrity)
- [📜 License](#-license)

---

## 🌟 Overview

**PJ Lawn** is a commercial-grade, full-stack digital reservation and venue management platform built for an open-air luxury celebration space in Nagercoil, Tamil Nadu. 

Engineered from the ground up for high-ticket hospitality, the platform transforms manual venue booking into an automated, highly secure self-service experience. From real-time slot checking and interactive booking wizards to cryptographic payment collection via Cashfree and automated invoice generation, PJ Lawn delivers an enterprise standard in reliability, aesthetics, and speed.

---

## 🏛️ Design Philosophy & Aesthetics

- **Dark Luxury Palette**: Crafted with rich deep charcoal backgrounds (`#060606`, `#0B0D0F`), radiant metallic gold accents (`#C9A84C`, `#E8C96D`), and warm ambient backdrops.
- **Strict Typography Architecture**:
  - Headings: Dignified serif typography (*Cormorant Garamond* / *Cinzel* style) for editorial luxury.
  - Body & UI: Crisp, accessible sans-serif typography (*Inter* / *SF Pro Text*).
  - Standardized Numerals: Enforced standard, non-stylized tabular numerals across all prices, dates, receipts, and counters (`unicode-range: U+0030-0039`) to prevent distorted numbers.
- **Mobile-First Responsive UX**: Tailored mobile drawer navigation, sticky booking CTAs, thumb-friendly slot pickers, and lightweight touch animations.
- **Glassmorphism & Micro-Animations**: Smooth hardware-accelerated spring animations powered by Framer Motion, refined frosted glass backdrops, and inertial page momentum with Lenis Smooth Scroll.

---

## ⚡ Tech Stack & Architecture

```mermaid
graph TD
    A[Client Browser / Mobile PWA] -->|React 19 + TypeScript| B[Netlify Edge CDN]
    B -->|Static Routing| C[Vite 8 Single Page App]
    C -->|Route Splitting| D[On-Demand Chunks]
    C -->|Auth / Firestore Reads| E[Firebase Cloud Platform]
    A -->|Serverless APIs| F[Netlify Functions Node.js]
    F -->|SDK v6 / API 2025-01-01| G[Cashfree PG Gateway]
    F -->|Admin SDK Privileged Ops| E
    F -->|Transactional Email| H[Resend API]
    G -->|HMAC-SHA256 Webhooks| F
```

### Frontend Core
- **Framework:** React 19 + Vite 8 (Rolldown bundler)
- **Language:** TypeScript 6
- **Styling:** Tailwind CSS + custom dark luxury token system
- **Motion & Scroll:** Framer Motion 13 + Lenis Smooth Scroll
- **Forms & Data Integrity:** React Hook Form + Zod schema validation
- **Calendars & Dates:** `date-fns` + `react-day-picker`
- **PDF Engine:** `@react-pdf/renderer` (Dynamically isolated chunk)
- **AI Integration:** `@google/genai` (Google Gemini 2.5 Flash)

### Backend & Cloud Infrastructure
- **Serverless Compute:** Netlify Serverless Functions (TypeScript / Node.js runtime)
- **Database:** Google Cloud Firestore (Real-time NoSQL with strict Security Rules)
- **Authentication:** Firebase Auth (Google OAuth) + Custom Claims escalation
- **Payment Processing:** Cashfree Payments PG (API `2025-01-01` via `cashfree-pg` v6 & `@cashfreepayments/cashfree-js` v3)
- **Email Delivery:** Resend Transactional Email API

---

## ✨ Core Features

### 1. Frictionless Booking Engine
- **Multi-Slot Selection**: Support for *Morning*, *Evening*, and *Full-Day* celebrations with automated buffer management.
- **Live Availability Engine**: Queries Firestore in real-time to disable booked or blocked dates on the calendar instantly.
- **Conversion-First Authentication**: Guests configure dates, event types, and guest counts freely. Authentication is seamlessly requested only at the final confirmation step, eliminating friction and bounce rates.
- **Dynamic Pricing Calculator**: Base rates, slot multipliers, and add-on services are computed in real time.

### 2. Bank-Grade Cashfree Payment Architecture
Integrated strictly following the Cashfree PG v6 specification and API version `2025-01-01`:
- **Server-Side Order Generation (`create-cashfree-order`)**: Price and booking validity are re-verified against Firestore server-side before generating a secure Cashfree `payment_session_id`. Client-side amounts can never be manipulated.
- **Seamless Drop-in Web Checkout**: Uses `@cashfreepayments/cashfree-js` v3 via a robust Promise-handling pattern supporting direct payment completions, bank redirects, and modal dismissal.
- **Authoritative Gateway Verification (`verify-cashfree-payment`)**: Calls Cashfree's authoritative `PGFetchOrder` and `PGOrderFetchPayments` APIs to confirm transaction status before updating Firestore or issuing receipts.
- **Cryptographic Asynchronous Webhooks (`cashfree-webhook`)**: Validates `x-webhook-signature` using constant-time HMAC-SHA256 (`crypto.timingSafeEqual`) on the raw payload. Handles `PAYMENT_SUCCESS_WEBHOOK`, `PAYMENT_FAILED_WEBHOOK`, and abandonment events with full idempotency.
- **Multi-Stage Payments**: Supports flexible payment models including **Advance Booking Amount**, **Remaining Balance**, or **Full Upfront Settlement**.

### 3. Client-Side Live PDF Receipt Generator
- **Dedicated Receipt Module (`ReceiptPDF.tsx`)**: Generates official branded tax invoices and receipts directly on the client using `@react-pdf/renderer`.
- **Dynamic Data Binding**: Injects booking ID, customer metadata, transaction IDs, payment mode, timestamps, and venue contact details.
- **Dual-Mode Delivery**: Instant in-browser PDF download + automated high-fidelity HTML email receipt dispatched via Resend.

### 4. Centralized High-Performance Auth Engine
- **Instant Hydration**: Singleton `AuthContext` backed by `localStorage` snapshots (`pj_auth_user`, `pj_auth_is_admin`). The UI renders authenticated user states instantly without white flashes or waiting for network round-trips.
- **Zero-Latency Route Guards**: `useAdminGuard` validates administrative status using memory and session cache, eliminating repeated Firestore reads during navigation.
- **DNS Preconnections**: Speculative DNS prefetch and preconnect tags configured for `identitytoolkit.googleapis.com`, `securetoken.googleapis.com`, `accounts.google.com`, and `firestore.googleapis.com`.

### 5. Administrative Suite & Custom Claims Control
- **Role-Based Access Control**: Protected `/admin` console guarded by Firebase Custom Claims (`admin: true`).
- **Revenue & Reservation Metrics**: Live financial overview of received advance payments, pending balances, and confirmed venue dates.
- **Booking Lifecycle Management**: Approve, reject, adjust base pricing, and manually lock out maintenance dates.
- **One-Click Claims Setup (`set-admin-claim`)**: Secure internal function to promote super-admin accounts using environment-protected secrets.

### 6. AI Venue Concierge
- **Interactive Assistant (`ChatbotWidget.tsx`)**: Powered by Google Gemini 2.5 Flash through the official `@google/genai` SDK.
- **Domain-Specific Knowledge**: Answers guest queries about capacity (50–300 guests), catering policies, power backup, parking amenities, location directions, and booking terms in real time.

### 7. Production Performance & Optimization
- **Route-Level Code Splitting**: All pages lazy-loaded via `React.lazy()` with a branded luxury diamond-star `<PageLoader />`.
- **96% Main Bundle Reduction**: Monolithic JavaScript bundle deconstructed into optimized vendor chunks:
  - `index-*.js` (Main Entry): **114 kB** (33 kB gzipped)
  - `vendor-react`: **220 kB** (Core React & Router)
  - `vendor-firebase`: **551 kB** (Auth & Firestore)
  - `vendor-motion`: **132 kB** (Framer Motion)
  - `vendor-pdf`: **1,260 kB** (Strictly isolated; only loaded when generating a receipt!)
- **Global Error Boundary (`ErrorBoundary.tsx`)**: Intercepts unhandled React rendering crashes and presents a luxury recovery screen with "Reload" and "Return Home" controls.
- **Custom 404 Route (`NotFound.tsx`)**: Elegant catch-all page featuring standard numerals, ambient particle effects, and exploration links.
- **Dynamic Route SEO (`usePageTitle.ts`)**: Automatic document title updating per route.

---

## 🤖 AI-Assisted Development

This project was conceived, architected, and refined through **AI-Assisted Development** utilizing **Google Antigravity** — Google DeepMind's state-of-the-art agentic AI coding environment.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   AI-ASSISTED DEVELOPMENT PIPELINE                     │
│                                                                        │
│  [Specification] ──► [Antigravity Agent] ──► [Tool / MCP Execution]   │
│                             │                                          │
│                             ├──► Firebase MCP & Rules Auditor         │
│                             ├──► Cashfree Agent Integration Skills    │
│                             ├──► Gemini API Docs & SDK Tooling        │
│                             ├──► Headless Browser Visual Subagents    │
│                             └──► Rolldown Chunking & Build Auditing   │
└────────────────────────────────────────────────────────────────────────┘
```

### Key AI Workflow Highlights:
1. **Agentic System Architecture**:
   - Complex full-stack features (Cashfree payment pipeline, Firebase Custom Claims, PDF generation, Netlify Serverless Functions) were designed and implemented using autonomous agentic loops with zero manual boilerplate.
2. **Model Context Protocol (MCP) Integration**:
   - Seamlessly utilized specialized MCP tools, including **Firebase MCP**, **Gemini API Docs MCP**, and **Netlify Extension Services** for contextual accuracy and real-time validation.
3. **Domain-Specific Agent Skills**:
   - Employed `cashfree-skills` for strict adherence to API version `2025-01-01`, idempotency standards, and webhook signature verification.
   - Applied `ui-ux-pro-max` for curated color palettes, accessible contrasts, and luxury design tokens.
4. **Automated Visual Verification & Browser Subagents**:
   - Automated browser subagents performed real-time UI audits, verified responsive layouts on simulated mobile viewports, recorded user flows, and confirmed visual contrast without manual testing cycles.
5. **Architectural Optimization**:
   - Autonomous profiling of bundle outputs identified monolithic bottlenecks, resulting in manual chunk isolation that reduced the initial bundle size by ~96%.

---

## 📁 Directory Architecture

```plaintext
pj-lawn/
├── netlify/
│   └── functions/               # Serverless backend functions
│       ├── adminDb.ts           # Firebase Admin SDK initialization
│       ├── cashfree-webhook.ts  # HMAC-SHA256 webhook receiver
│       ├── create-cashfree-order.ts # Order creation & Firestore validation
│       ├── send-email.ts        # Transactional email dispatcher via Resend
│       ├── set-admin-claim.ts   # Secure Firebase Admin Custom Claim setup
│       └── verify-cashfree-payment.ts # Authoritative Cashfree payment verification
├── public/                      # Static web assets & icons
├── src/
│   ├── components/
│   │   ├── layout/              # Navbar, Footer, MobileBottomNav, Layout
│   │   ├── ui/                  # Button, Card, Dialog, PageLoader, ErrorBoundary
│   │   └── ReceiptPDF.tsx       # Live client-side PDF invoice component
│   ├── context/
│   │   └── AuthContext.tsx      # High-performance cached auth state provider
│   ├── hooks/
│   │   ├── useAdminGuard.ts     # Protected route security hook
│   │   └── usePageTitle.ts      # Route-aware dynamic document title manager
│   ├── lib/
│   │   ├── cashfree.ts          # Cashfree JS SDK v3 client initialization
│   │   ├── firebase.ts          # Firebase Client App, Auth & Firestore config
│   │   ├── firestore.ts         # Centralized database queries & mutations
│   │   └── gemini.ts            # Gemini 2.5 Flash client setup
│   ├── pages/                   # Lazy-loaded route views
│   │   ├── About.tsx
│   │   ├── Admin.tsx
│   │   ├── Amenities.tsx
│   │   ├── Booking.tsx
│   │   ├── Contact.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Events.tsx
│   │   ├── Gallery.tsx
│   │   ├── Home.tsx
│   │   ├── Location.tsx
│   │   ├── NotFound.tsx         # Luxury 404 handler
│   │   ├── Privacy.tsx
│   │   ├── RefundPolicy.tsx
│   │   └── Terms.tsx
│   ├── App.tsx                  # Root router with Suspense & Route Splitting
│   ├── index.css                # Tailwind base, luxury surface tokens & typography
│   └── main.tsx                 # Application entry point
├── netlify.toml                 # Netlify deployment, redirects & headers configuration
├── package.json                 # Dependencies and build scripts
├── tailwind.config.js           # Theme extensions, gold palettes & animations
└── vite.config.ts               # Vite 8 config with Rolldown manual chunks
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**
- **Netlify CLI** (`npm install -g netlify-cli`) for running serverless functions locally

### 2. Clone the Repository
```bash
git clone https://github.com/jinsu-2005/pj-lawn-official.git
cd pj-lawn
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the project root:

```ini
# Firebase Client SDK
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Gemini API
VITE_GEMINI_API_KEY=your_gemini_api_key

# Cashfree Payments (Client)
VITE_CASHFREE_MODE=sandbox # or production

# Netlify Serverless Backend Credentials
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=TEST # or PRODUCTION
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
ADMIN_SECRET=your_secure_random_admin_secret
RESEND_API_KEY=your_resend_api_key
```

### 5. Start Development Server
To run both the Vite frontend and Netlify Serverless Functions:
```bash
npm run dev
# Or for full serverless emulation:
npx netlify dev
```

The application will be live at `http://localhost:5173` (or `http://localhost:8888` via Netlify CLI).

### 6. Production Build
```bash
npm run build
```
Type checks via `tsc` and compiles the optimized bundle to `dist/`.

---

## 🔐 Security & Data Integrity

- **Zero Client-Side Secrets**: Private keys (`CASHFREE_SECRET_KEY`, `FIREBASE_PRIVATE_KEY`, `ADMIN_SECRET`, `RESEND_API_KEY`) strictly reside in serverless runtime memory and are never exposed to the client bundle.
- **HMAC Signature Verification**: Cashfree webhook payloads are verified using constant-time cryptographic comparisons (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Firestore Security Rules**: Strict read/write permissions ensure customers can only access their own reservation records, while status transitions and pricing updates require administrative claims.
- **Strict Content Security**: Protected against clickjacking, MIME sniffing, and cross-site scripting via HTTP headers configured in `netlify.toml`.

---

## 📜 License

Private and proprietary. Developed for **PJ Lawn**, Nagercoil, Tamil Nadu, India. All rights reserved.

<div align="center">
  <br />
  <p>Crafted with elegance & precision • <strong>PJ Lawn Official</strong></p>
</div>
