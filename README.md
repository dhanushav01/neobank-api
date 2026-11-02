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

### 2. Configure Local Environment
Copy the example environment configuration:
```bash
# Linux / macOS
cp .env.example .env

# Windows PowerShell
copy .env.example .env
```
Ensure `ENVIRONMENT=development` is set in `.env` (this is the default in `.env.example`).
In development mode:
- Interactive Swagger docs (`/`) and Redoc (`/redoc`) are available.
- Relaxed cookie policies allow standard `http://localhost:8000` session testing.
- Test endpoints (`/delay`, `/flaky`, `/rate-limit`) are accessible.
- Set `SEED_DEMO_USERS=true` in `.env` if you want automatic test accounts pre-seeded with sample balances and cards.

### 3. Run the Platform Server Locally
Run with Uvicorn in development mode:
```bash
# macOS / Linux
ENVIRONMENT=development uvicorn backend.app.main:app --reload --port 8000

# Windows PowerShell
$env:ENVIRONMENT="development"; uvicorn backend.app.main:app --reload --port 8000
```
Or directly from the backend module:
```bash
python backend/run.py
```
Or via the legacy root launcher:
```bash
uvicorn app:app --reload --port 8000
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

| Role | Provisioning / Setup | Privileges |
|---|---|---|
| **Super Admin** | Provisioned via environment secrets | Complete system oversight, staff onboarding, SQL database workbench access, platform resets |
| **Bank Administrator** | Created by Super Admin with dual-approval | KYC underwriting, loan decisioning, dispute resolution, user status management |
| **Bank Staff (Employee)** | Created by Super Admin with employee verification | Customer directory, account applications, review queues (SQL access configurable per account) |
| **Customer** | Self-service registered via `/auth/register` or `/onboarding` | Personal accounts, debit cards, transfers, bill payments, FX swaps, investment portfolios |

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
2. Retrieve OTP verification code (delivered via `OTP_DELIVERY`, default `notification` in user notification feed)
3. `POST /transfers/{transferId}/confirm` (or `/transfers/{transferId}/confirm-otp`) with 6-digit verification code to complete transfer and debit ledger

> [!WARNING]
> **Demo-Only 2FA Notice**: In demo/sandbox mode, the 6-digit transfer OTP is dispatched to the user's in-app notification feed (`OTP_DELIVERY=notification`) so evaluators can complete end-to-end flows. In a production banking environment, delivering an OTP to the same authenticated browser session is **not** a secure second factor; genuine 2FA requires an out-of-band delivery channel (e.g., SMS, push notification to an enrolled hardware device, or TOTP authenticator). Supported flags: `OTP_DELIVERY=notification|console|none`.

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
- Document attachments are encrypted using **Fernet (AES-128-CBC with HMAC-SHA256 authenticated encryption)** in SQLite BLOBs and decrypted on-demand with inline previews (images, PDFs, text) and secure file download.
- Uniform Account Opening Applications support authentic 4-page bank paper sheet visualization with CIF & CKYC, KYC & OVD, Account Specification, and Declarations, complete with print-to-PDF export.
- Passwords are securely hashed using **Bcrypt** (work factor 12) with per-user cryptographic salts. Card PINs are securely hashed using **PBKDF2-HMAC-SHA256** (100,000 iterations).
- High-value transfer verification uses **HMAC-PBKDF2-SHA256** salted hashes. In sandbox/demo environments, verification codes are delivered in-app via `OTP_DELIVERY=notification`. This is intended strictly for test harness verification and does not replace true out-of-band second factor authentication (SMS, hardware tokens, TOTP).

---

## Production Deployment & Security Configuration (Render / Cloud)

When deploying to Render, Railway, or standard Docker environments:

1. **Environment Mode & Secrets**:
   - `ENVIRONMENT=production`: Enforces secure cookie policies (`COOKIE_SECURE=true`), disables interactive documentation (`/docs`, `/redoc`), and deactivates platform data reset endpoints.
   - `JWT_SECRET`: Mandatory high-entropy secret (minimum 32 bytes) for signing authentication tokens.
   - `NEOBANK_DOC_KEY`: Mandatory base64 Fernet 256-bit key for AES document encryption.
   - `POS_GATEWAY_KEY`: Mandatory 32-byte secret key for POS payment authorization (`X-Gateway-Key` header).
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD`: Safe first-admin bootstrap credentials for fresh production deployment.
   - `NEOBANK_DB_PATH`: Absolute path to SQLite database on persistent storage (e.g. `/data/neobank.db`).
   - `SEED_DEMO_USERS=false`: Ensures demo accounts are never provisioned in production.

2. **Persistent Storage (Render Disks)**:
   > **Important on Render Data Retention**: Standard web services on Render have ephemeral root filesystems that wipe upon every restart or redeploy. To persist ledger accounts, transactions, and encrypted KYC documents:
   > - In the Render Dashboard, go to your Web Service **Disks** section and click **Add Disk**.
   > - **Disk Name**: `neobank-storage`
   > - **Mount Path**: `/data` (Single documented path)
   > - **Size**: `1 GB` (or larger)
   > - In **Environment**, configure: `NEOBANK_DB_PATH=/data/neobank.db`
   > - **Permissions**: The container entrypoint (`docker-entrypoint.sh`) automatically configures `/data` ownership for unprivileged `appuser` (UID 1001) using `gosu` before starting the application.

3. **First-Admin Bootstrap Steps on Render**:
   When launching a fresh deployment on Render with a new persistent disk:
   1. Open your Web Service in the **Render Dashboard** -> **Environment**.
   2. Configure the two bootstrap variables:
      - `ADMIN_EMAIL`: The designated superadmin email (e.g. `admin@yourdomain.com`).
      - `ADMIN_PASSWORD`: A strong initial password (at least 16 characters with letters, numbers, and symbols).
   3. Trigger a manual deploy or restart the service.
   4. On startup, the backend verifies if an admin exists; if absent, it safely hashes the credentials with Bcrypt and provisions the superadmin account with `role: "ADMIN"`.
   5. Log into the web portal at `/app` or `/login.html` using the configured credentials.
   6. *(Recommended Security Practice)* Clear or remove `ADMIN_PASSWORD` from the Render Environment settings after initial setup so that plaintext bootstrap secrets do not linger in the dashboard.

4. **Dependency Vulnerability Scanning**:
   Run audits with `pip-audit`:
   ```bash
   pip install pip-audit
   pip-audit -r requirements.txt
   ```

