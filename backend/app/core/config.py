"""
Configuration settings, reference datasets, and constant values for NeoBank.
"""
from typing import Dict, Any, List

PROJECT_NAME = "NeoBank Financial Platform"
VERSION = "2.1.0"
DESCRIPTION = """
Production-ready Neobank REST API platform with strict role-based access control,
multi-currency accounts, instant transfers, card issuance, loan underwriting,
KYC identity verification, and dispute resolution.
"""

# Foreign Exchange Reference Rates (Base USD)
FX_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "INR": 83.1,
    "JPY": 150.0,
    "CAD": 1.36,
    "AUD": 1.52,
    "CHF": 0.91
}

# Supported Countries
COUNTRIES: List[Dict[str, str]] = [
    {"code": "GB", "name": "United Kingdom", "currency": "GBP"},
    {"code": "US", "name": "United States", "currency": "USD"},
    {"code": "DE", "name": "Germany", "currency": "EUR"},
    {"code": "IN", "name": "India", "currency": "INR"},
    {"code": "JP", "name": "Japan", "currency": "JPY"},
    {"code": "CA", "name": "Canada", "currency": "CAD"},
    {"code": "AU", "name": "Australia", "currency": "AUD"}
]

# Partner Banks
BANKS: Dict[str, Dict[str, str]] = {
    "NBK001": {"name": "NeoBank Global", "country": "GB", "swift": "NEOBGB2L"},
    "HSB002": {"name": "Harbor Savings Bank", "country": "GB", "swift": "HRBSGB2L"},
    "CTB003": {"name": "Citadel Trust Bank", "country": "US", "swift": "CTBKUS33"},
    "EUB004": {"name": "EuroBank AG", "country": "DE", "swift": "EUBKDEFF"},
    "IND005": {"name": "Indus National Bank", "country": "IN", "swift": "INDNINBB"},
    "TKY006": {"name": "Tokyo Mercantile", "country": "JP", "swift": "TKMCJPJT"}
}

# Major Cities for Branches / ATMs
CITIES = ["London", "Manchester", "Leeds", "Bristol", "Glasgow", "Cardiff", "Belfast", "Edinburgh"]

# Registered Utility Billers
BILLERS: Dict[str, Dict[str, Any]] = {
    "bl_power": {"id": "bl_power", "name": "National Power & Electric", "category": "UTILITIES", "minAmount": 5.0},
    "bl_water": {"id": "bl_water", "name": "Aqua Clean Water Co.", "category": "UTILITIES", "minAmount": 5.0},
    "bl_net": {"id": "bl_net", "name": "GigaFiber Broadband", "category": "INTERNET", "minAmount": 10.0},
    "bl_mobile": {"id": "bl_mobile", "name": "Horizon Telecom 5G", "category": "TELECOM", "minAmount": 5.0},
    "bl_ins": {"id": "bl_ins", "name": "Guardian Life & Health", "category": "INSURANCE", "minAmount": 25.0},
    "bl_tax": {"id": "bl_tax", "name": "HM Revenue & Customs", "category": "GOVERNMENT", "minAmount": 1.0}
}

# Investment Instruments
INSTRUMENTS: Dict[str, tuple] = {
    "AAPL": ("Apple Inc.", "STOCK", 195.50),
    "MSFT": ("Microsoft Corp.", "STOCK", 425.20),
    "TSLA": ("Tesla Inc.", "STOCK", 248.80),
    "NVDA": ("Nvidia Corp.", "STOCK", 128.40),
    "VOO": ("Vanguard S&P 500 ETF", "ETF", 492.10),
    "BND": ("Vanguard Total Bond Market ETF", "ETF", 73.50),
    "GLD": ("SPDR Gold Shares ETF", "ETF", 218.60)
}

# OpenAPI Tag Groups
TAGS = [
    {"name": "Account Onboarding", "description": "Customer account selection, eligibility check, application submission with unique reference number, status tracking, and staff review with date filtering."},
    {"name": "Auth", "description": "Authentication: Unified login for all roles, employee registration, session tokens, MFA."},
    {"name": "Users", "description": "Current user profile and personal financial dashboard summary."},
    {"name": "KYC", "description": "Identity verification submission and status checking."},
    {"name": "Accounts", "description": "Account management (Checking, Savings, Multi-currency), deposits, withdrawals, transactions."},
    {"name": "Transfers", "description": "Domestic & International money transfers, OTP challenge verification."},
    {"name": "Cards", "description": "Virtual and physical debit cards, card locking, PIN updates, spend limits, POS authorizations."},
    {"name": "Loans", "description": "Loan quotes, applications, installments repayment schedule."},
    {"name": "Disputes", "description": "Charge disputes on suspicious debit/card transactions."},
    {"name": "Admin", "description": "Bank Staff / Employee operations: KYC review, loan underwriting, dispute resolution, user oversight."},
    {"name": "FX", "description": "Real-time foreign currency exchange rates and instant currency conversion."},
    {"name": "Beneficiaries", "description": "Saved payees and recipients management."},
    {"name": "Bill Payments", "description": "Registered utility bills and scheduled bill payments."},
    {"name": "Investments", "description": "Equities, ETFs, price-lock quotes, investment portfolios, and order execution."},
    {"name": "Statements", "description": "Asynchronous official PDF/CSV statement requests and downloads."},
    {"name": "Notifications", "description": "In-app notifications and real-time alerts."},
    {"name": "Reference Data", "description": "Lookup banks, currencies, countries, branches, and ATMs."},
    {"name": "System", "description": "Health checks, metrics, and developer diagnostic utilities."}
]
