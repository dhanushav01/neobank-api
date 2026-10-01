-- =====================================================================
-- NeoBank Core Banking System - Relational SQL Database Schema
-- Compatible with SQLite, PostgreSQL, and MySQL
-- Supports AES-256 Encrypted Documents & Salted PBKDF2 Password Hashes
-- =====================================================================

-- 1. Users Table (Customers, Bank Staff, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(190) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Salted PBKDF2 / Argon2 / bcrypt hash
    role VARCHAR(20) NOT NULL,           -- CUSTOMER, EMPLOYEE, ADMIN
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, DEACTIVATED
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE,
    phone VARCHAR(30),
    address_json TEXT,                   -- Street, City, PostalCode, Country
    employee_code VARCHAR(30),           -- For Bank Staff
    department VARCHAR(50),              -- OPERATIONS, UNDERWRITING, etc.
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bank Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL,           -- CHECKING, SAVINGS, SALARY, STUDENT
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    overdraft_limit DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    nickname VARCHAR(60),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, CLOSED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Core Ledger Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL,
    type VARCHAR(30) NOT NULL,           -- DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, FEE
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    balance_after DECIMAL(15, 2) NOT NULL,
    reference VARCHAR(255),
    channel VARCHAR(30) DEFAULT 'ONLINE', -- ATM, BRANCH, MOBILE, ONLINE
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 4. Payment & Debit Cards
CREATE TABLE IF NOT EXISTS cards (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    account_id VARCHAR(64) NOT NULL,
    type VARCHAR(20) NOT NULL,           -- PHYSICAL, VIRTUAL
    network VARCHAR(20) NOT NULL DEFAULT 'VISA',
    cardholder_name VARCHAR(100) NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, FROZEN, BLOCKED
    daily_limit DECIMAL(10, 2) DEFAULT 3000.00,
    monthly_limit DECIMAL(10, 2) DEFAULT 15000.00,
    atm_limit DECIMAL(10, 2) DEFAULT 1000.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 5. Customer Account Opening Applications
CREATE TABLE IF NOT EXISTS applications (
    application_number VARCHAR(40) PRIMARY KEY, -- e.g. APP-2026-891042
    email VARCHAR(190) NOT NULL,
    account_type VARCHAR(30) NOT NULL,          -- SAVINGS, CHECKING, SALARY, STUDENT
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    initial_deposit DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_id VARCHAR(40) NOT NULL,                -- SSN, PAN, Tax Identification
    password_hash VARCHAR(255) NOT NULL,
    applicant_json TEXT NOT NULL,               -- Personal details, contacts, address
    employment_json TEXT NOT NULL,              -- Employment status, employer, income
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, ACCOUNT_OPENED, REJECTED
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by VARCHAR(64) NULL,
    review_notes TEXT NULL,
    generated_account_number VARCHAR(20) NULL
);

-- 6. Encrypted Verification Documents & PDFs
-- Binary files and PDFs are encrypted using AES-256 before storage
CREATE TABLE IF NOT EXISTS encrypted_documents (
    id VARCHAR(64) PRIMARY KEY,
    application_number VARCHAR(40),
    user_id VARCHAR(64),
    doc_category VARCHAR(40) NOT NULL, -- IDENTITY, ADDRESS_PROOF, INCOME_PROOF
    doc_type VARCHAR(40) NOT NULL,     -- PASSPORT, DRIVERS_LICENSE, UTILITY_BILL, etc.
    doc_number VARCHAR(60),
    file_name VARCHAR(255) NOT NULL,
    file_mime VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
    file_size_bytes BIGINT NOT NULL,
    encrypted_blob LONGBLOB NOT NULL,  -- Encrypted ciphertext (never plain text)
    is_encrypted SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_number) REFERENCES applications(application_number) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Loans Underwriting
CREATE TABLE IF NOT EXISTS loans (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    account_id VARCHAR(64),
    amount DECIMAL(15, 2) NOT NULL,
    apr DECIMAL(5, 2) NOT NULL,
    term_months INT NOT NULL,
    monthly_payment DECIMAL(12, 2) NOT NULL,
    purpose VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Transaction Disputes
CREATE TABLE IF NOT EXISTS disputes (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    transaction_id VARCHAR(64) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    resolution TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Institutional Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(60) NOT NULL,
    resource VARCHAR(120),
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Performance Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_num ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_trans_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_apps_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_apps_created ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_enc_docs_app ON encrypted_documents(application_number);
