# Mahalaxmi General Stores Management System
**Location**: Honnavar, Uttara Kannada, Karnataka, India  
**Architecture**: Production-minded, Offline-First Local Retail POS & ERP  

---

## 1. Overview

This system is built specifically for **Mahalaxmi General Stores**, a coastal Karnataka retail provision and general store selling both packaged FMCG items and loose goods (grains, pulses, jaggery, sugar sold by kg/g).

It is designed to run locally on the shop counter computer using a local **SQLite** database in WAL mode (Write-Ahead Logging). No internet connection is needed for normal daily sales, stock management, customer credit (Udhaar) tracking, or receipt printing. Other devices in the store (like a shopkeeper's tablet or phone connected to the store's local Wi-Fi router) can connect directly to the counter computer's IP address.

---

## 2. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js (v24), Express, TypeScript, Zod.
- **Database**: SQLite (Node.js native `node:sqlite` engine with WAL journaling & foreign key constraints).
- **Migration Engine**: Custom atomic transaction migration system tracking SHA-256 checksums in `_migrations`.
- **Testing**: Vitest + React Testing Library (with jsdom).
- **Styling Theme**: Warm Indian general store theme (amber/gold accent, clean cards, subtle borders, high contrast).

---

## 3. Directory Structure

```
Mahalaxmi General Stores/
├── .gitignore                   # Excludes node_modules, dist, *.db, and secrets
├── package.json                 # Monorepo workspaces orchestrator (server + client)
├── README.md                    # Setup and architecture documentation
├── data/                        # Local SQLite database directory (outside client web root)
│   └── mahalaxmi.db             # Local database file (auto-created on startup)
├── server/                      # Express + SQLite Backend API
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example             # Server configuration template
│   ├── src/
│   │   ├── config/              # Zod-validated environment config
│   │   ├── db/
│   │   │   ├── index.ts         # SQLite connection & transaction runner
│   │   │   ├── migrate.ts       # Atomic SQL migration runner
│   │   │   ├── seed.ts          # Realistic demo dataset for Honnavar store
│   │   │   └── migrations/
│   │   │       └── 001_initial_schema.sql  # Complete relational schema
│   │   ├── middleware/          # Request logging and centralized error handling
│   │   ├── modules/
│   │   │   └── dashboard/       # Dashboard analytics service, controller & routes
│   │   ├── app.ts               # Express application pipeline
│   │   └── index.ts             # Server entrypoint with LAN IP detection
│   └── tests/
│       ├── db.test.ts           # Migration and transaction rollback tests
│       └── dashboard.test.ts    # Dashboard metric calculation tests
└── client/                      # React + TypeScript + Vite Frontend
    ├── package.json
    ├── vite.config.ts           # Proxy /api to backend (port 3001)
    ├── tailwind.config.js       # Shop theme color palette
    ├── postcss.config.js
    ├── index.html               # PWA meta tags & title
    ├── public/
    │   └── manifest.json        # PWA manifest foundation
    ├── src/
    │   ├── components/
    │   │   ├── layout/          # Sidebar, Header, MobileNav, AppLayout
    │   │   └── ui/              # StatCard, Badge
    │   ├── pages/
    │   │   └── DashboardPage.tsx# Foundation dashboard with KPI cards and demo banner
    │   ├── services/
    │   │   └── api.ts           # Type-safe API client
    │   ├── types/               # TypeScript interfaces
    │   ├── App.tsx              # Main application router and state
    │   ├── main.tsx
    │   └── index.css            # Tailwind directives and keyboard navigation styling
    └── tests/
        ├── setup.ts
        └── Dashboard.test.tsx   # React component tests
```

---

## 4. How to Run the Application

### Prerequisites
- Node.js (v20+ or v24+)
- npm (v10+ or v11+)

### Option A: Run Both Together (Recommended)
From the root folder (`c:\Mahalaxmi General Stores`):
```bash
npm run dev
```
This runs both the backend server (on `http://localhost:3001`) and the Vite frontend (on `http://localhost:5173`) concurrently.

### Option B: Run Individually in Separate Terminals

1. **Start the Backend Server**:
   ```bash
   npm --workspace=server run dev
   ```
   - Automatically runs pending database migrations on startup.
   - Automatically initializes realistic demo data on the first run.
   - Listens on `http://localhost:3001` and your local LAN IP address.

2. **Start the Frontend Client**:
   ```bash
   npm --workspace=client run dev
   ```
   - Opens the POS interface on `http://localhost:5173`.
   - Proxies API calls automatically to the backend.

---

## 5. Running Tests and Builds

### Run All Tests:
```bash
npm test
```
Executes both server database/migration tests and client UI tests with Vitest.

### Run Production Build:
```bash
npm run build
```
Typechecks with `tsc` and compiles optimized production bundles for both backend and frontend.

### Re-run Migrations or Reset Demo Data:
```bash
npm run db:migrate
npm run db:seed
```

---

## 6. What Was Implemented in Stage 1

1. **Monorepo Workspace & Foundation**: Cleanly separated client and server using npm workspaces.
2. **Reliable SQLite Migration Engine**: Schema migrations with transaction isolation and checksum verification.
3. **Database Schema (`001_initial_schema.sql`)**: Covers shop settings, categories, products (loose & packaged), customers, suppliers, bills, bill items, customer credit ledger (Udhaar), expenses, and audit logs.
4. **Honnavar Realistic Demo Seeder**: Includes authentic items like *Sona Masoori Rice (Loose)*, *Nandini Toned Milk*, *Nandini Pure Ghee*, *Tata Salt*, *Gemini Oil*, *Mysore Sandal Soap*, and local Udhaar customer accounts (*Ganesh Naik, Suresh Bhat*).
5. **Interactive Dashboard**:
   - Prominent **Demo Data Mode** notification banner.
   - Key KPIs: Today's Sales, Cash in Drawer, UPI Collections, Udhaar Given, Estimated Gross Profit, Outstanding Udhaar, Low Stock alerts.
   - Quick action shortcuts (with `F2` keyboard shortcut for New Bill).
   - Recent Bills feed and Low Stock alerts with Kannada naming support.
   - Offline system status indicator.
6. **Testing**: 7 comprehensive unit tests passing with 100% success rate.
