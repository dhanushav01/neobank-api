# NeoBank Digital Banking Platform & REST API

Enterprise-grade digital banking platform and stateful REST API sandbox for **banking operations, automation testing, underwriting workflows, and developer QA**.

Features **180+ endpoints across 25 functional domains**, accompanied by a modern **2026 Web Application UI**, an integrated **SQL Database GUI Workbench**, an interactive **Customer Onboarding Wizard**, and live **Swagger API Documentation** served at the root URL.

---

## Architecture Overview

```
neobank-api/
├── backend/
│   ├── app/
│   │   ├── core/           # Security, config, database bridge, SQLite engine, crypto
│   │   ├── models/         # Unified Pydantic schemas and request validators
│   │   ├── routers/        # 25 domain routers (auth, accounts, cards, loans, kyc, etc.)
│   │   └── main.py         # Main FastAPI application entrypoint
│   ├── data/               # Persistent SQLite database storage (neobank.db)
│   └── run.py              # Quick server launcher
├── frontend/
│   ├── css/                # Modern design system, typography, dark/light themes
│   ├── js/                 # Unified API client, auth, onboarding, staff & customer engines
│   ├── index.html          # Unified Portal (Customer & Staff Dashboard)
│   ├── onboarding.html     # Multi-step Customer Account Opening Wizard
│   ├── employee_onboarding.html # Staff Registration Portal
│   ├── sql_gui.html        # Interactive SQL Database GUI Workbench
│   └── login.html          # Authentication view
├── app.py                  # Monolith backward-compatible runner
├── Dockerfile              # Container deployment recipe
├── requirements.txt        # Unified Python dependencies
└── README.md
```

---

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run the Platform Server
Run via the root launcher:
```bash
uvicorn app:app --reload --port 8000
```
Or directly from the backend module:
```bash
python backend/run.py
```

---

## Platform Portals & Access Points

| Portal / View | URL | Description |
|---|---|---|
| 🎨 **Digital Banking App** | **[http://127.0.0.1:8000/app](http://127.0.0.1:8000/app)** | Unified customer & staff dashboard with accounts, cards, wires, FX, and portfolios |
| ⚡ **SQL Database GUI** | **[http://127.0.0.1:8000/sql-gui](http://127.0.0.1:8000/sql-gui)** | Relational SQLite workbench for ledger inspection and analytical queries |
| 📝 **Account Opening Wizard** | **[http://127.0.0.1:8000/onboarding](http://127.0.0.1:8000/onboarding)** | Multi-step interactive customer onboarding & identity verification workflow |
| 📄 **Interactive Swagger Docs** | **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** | Full OpenAPI 3.1 documentation with interactive "Try it out" and Authorize |
| 📚 **Redoc Documentation** | **[http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)** | Clean developer reference documentation |
| 📊 **OpenAPI JSON Spec** | **[http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)** | Machine-readable API schema |

---

## Role-Based Access Control (RBAC)

The platform provides a 4-tier role hierarchy:

| Role | Default Demo Account | Privileges |
|---|---|---|
| **Super Admin** | `admin@bank.test` / `Admin@1234` | Complete system oversight, staff onboarding, SQL database workbench access, platform resets |
| **Bank Administrator** | Configured during onboarding | KYC underwriting, loan decisioning, dispute resolution, user status management |
| **Bank Staff (Employee)** | `employee@bank.test` / `Employee@1234` | Customer directory, account applications, review queues (SQL access configurable per account) |
| **Customer** | `customer@bank.test` / `Customer@1234` | Personal accounts, debit cards, transfers, bill payments, FX swaps, investment portfolios |

---

## The 25 Functional API Domains

| Section | Description |
|---|---|
| **Auth** | Unified authentication, registration, session refresh, MFA enable/verify, password management |
| **Users** | Customer profiles, contact details, aggregated dashboard metrics across cards, balances, and loans |
| **KYC** | Identity verification, government ID document submissions, employment details, compliance tracking |
| **Accounts** | Checking, Savings, and Business accounts, balance inspection, freeze/unfreeze, statements |
| **Transfers** | Internal & external payments, idempotency key support, OTP challenge & confirmation (> $1,000) |
| **Cards** | Virtual and physical debit cards, spending limits, PIN changes, temporary/permanent block, POS simulation |
| **Disputes** | Transaction disputes, evidence attachment, admin resolution with automated ledger refunds |
| **Loans** | APR calculation quotes, loan applications, admin underwriting decisions, repayment schedules |
| **FX** | Live exchange rates, 60-second price-lock quotes, currency exchange between customer accounts |
| **Beneficiaries** | Full CRUD for saved payment payees |
| **Standing Orders** | Automated recurring transfers and scheduled payment execution |
| **Bill Payments** | Utility and telecom biller catalog, customer payee CRUD, scheduled bill payments |
| **Investments** | Stock & ETF market instruments, 30-second locked price quotes, portfolios, market & limit orders |
| **Statements** | Asynchronous job simulation (`Request` -> `Polling` -> `Ready` -> `Download`) |
| **Payment Links** | Merchant payment link creation, public link inspection, authenticated payer checkout |
| **Savings Goals** | Target savings goals with linked accounts, progress calculations, and deposits |
| **Budgets** | Category spending budgets, real-time tracking against debit transactions |
| **Webhooks** | Webhook subscriptions, security signatures, and test event dispatch triggers |
| **API Keys** | Developer API keys with granular scopes and rotation support |
| **Support** | Customer help desk tickets, multi-party messaging, resolution tracking |
| **Notifications** | In-app notification inbox, mark as read, read all, delete |
| **Analytics** | Spending categorized by merchant category, cash-inflow and cash-outflow analytics |
| **Reference Data** | Public lookup datasets (banks, branch locations, ATMs, bank holidays, currencies, countries) |
| **Admin** | Staff operations: KYC approvals, loan decisions, dispute resolution, account suspension, audit logs |
| **System** | Health check, version info, flaky endpoint (retry testing), rate limiting (429 testing), latency injector |
| **Database GUI** | `/api/db` relational schema inspection, table data pagination, and analytical query execution |

---

## Core Testing & Chaining Workflows

### 1. Customer Account Opening & KYC Review
1. `POST /onboarding/apply` (Customer submits multi-step application with personal and KYC data)
2. `GET /onboarding/track/{appNumber}` (Check real-time application underwriting progress)
3. `POST /admin/kyc/{kycId}/review` (Bank Officer reviews and approves KYC submission)
4. `POST /auth/login` (Customer signs into online banking with newly issued credentials)

### 2. High-Value Transfer with OTP Protection
1. `POST /transfers` with amount > `1000` USD (triggers OTP verification challenge)
2. `POST /transfers/{transferId}/confirm` with `testModeOtp` (completes wire and debits ledger)

### 3. Card Dispute & Automated Ledger Settlement
1. `POST /cards/{cardId}/authorize` (Simulate merchant POS transaction)
2. `POST /transactions/{txId}/disputes` (File dispute for unauthorized charge)
3. `POST /disputes/{disputeId}/evidence` (Submit proof/receipt)
4. `POST /admin/disputes/{disputeId}/resolve` (Admin approves dispute; refund instantly credited)

### 4. Stock & ETF Investment Execution
1. `GET /investments/instruments/AAPL/quote` (Lock real-time quote for 30 seconds)
2. `POST /investments/portfolios` (Create portfolio linked to primary checking account)
3. `POST /investments/portfolios/{id}/orders` (Submit buy/sell order with `quoteId`)
4. `GET /investments/portfolios/{id}/holdings` (Inspect real-time holdings, cost basis, and PnL)

---

## Docker Support

Build and deploy the platform in a containerized environment:
```bash
docker build -t neobank-api .
docker run -p 8000:8000 neobank-api
```

---

## Security & Privacy Notice

- All physical SQLite databases (`*.db`), credentials, and local runtime scratch scripts are strictly excluded from version control via `.gitignore`.
- Document attachments are encrypted using **AES-256** symmetric encryption.
- Passwords are encrypted using **PBKDF2-HMAC-SHA256** with 100,000 iterations and 16-byte random salts.
