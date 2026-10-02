/**
 * NeoBank Core Banking Platform - Centralized Shared Constants
 * Single source of truth for application types, currencies, roles, languages, and endpoints.
 */
(function(window) {
  'use strict';

  const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', native: 'English (EN)', flag: 'us' },
    { code: 'es', name: 'Spanish', native: 'Español (ES)', flag: 'es' },
    { code: 'fr', name: 'French', native: 'Français (FR)', flag: 'fr' },
    { code: 'de', name: 'German', native: 'Deutsch (DE)', flag: 'de' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी (HI)', flag: 'in' },
    { code: 'ar', name: 'Arabic', native: 'العربية (AR)', flag: 'ae' },
    { code: 'zh-CN', name: 'Chinese', native: '中文 (ZH)', flag: 'cn' },
    { code: 'ja', name: 'Japanese', native: '日本語 (JA)', flag: 'jp' },
    { code: 'ru', name: 'Russian', native: 'Русский (RU)', flag: 'ru' },
    { code: 'pt', name: 'Portuguese', native: 'Português (PT)', flag: 'pt' },
    { code: 'it', name: 'Italian', native: 'Italiano (IT)', flag: 'it' },
    { code: 'ko', name: 'Korean', native: '한국어 (KO)', flag: 'kr' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe (TR)', flag: 'tr' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands (NL)', flag: 'nl' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা (BN)', flag: 'bd' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ் (TA)', flag: 'in' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు (TE)', flag: 'in' }
  ];

  const ACCOUNT_TYPES = {
    SAVINGS: { code: 'SAVINGS', label: 'High-Yield Savings', apy: '4.20%', minDeposit: 100, currency: 'USD', description: 'Institutional liquid deposit with daily compounding yield.' },
    CHECKING: { code: 'CHECKING', label: 'Primary Checking', apy: '1.25%', minDeposit: 25, currency: 'USD', description: 'Zero-fee checking with instant debit settlement and multi-currency transfers.' },
    BUSINESS: { code: 'BUSINESS', label: 'Commercial Treasury', apy: '3.85%', minDeposit: 500, currency: 'USD', description: 'Treasury operations, automated payroll, and high-limit debit management.' },
    MONEY_MARKET: { code: 'MONEY_MARKET', label: 'Money Market Deposit', apy: '4.65%', minDeposit: 250, currency: 'USD', description: 'High-yield tier with flexible liquidity and check-writing privileges.' },
    NRI_EXPAT: { code: 'NRI_EXPAT', label: 'Non-Resident Expat Vault', apy: '4.10%', minDeposit: 200, currency: 'USD', description: 'Global repatriable currency accounts with preferential FX spreads.' },
    STUDENT: { code: 'STUDENT', label: 'Student Advantage', apy: '2.50%', minDeposit: 0, currency: 'USD', description: 'Zero minimum balance checking with financial literacy perks.' },
    SENIOR_CITIZEN: { code: 'SENIOR_CITIZEN', label: 'Senior Citizen Pension', apy: '4.80%', minDeposit: 50, currency: 'USD', description: 'Preferential interest rates, doorstep banking, and dedicated support.' }
  };

  const USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    EMPLOYEE: 'EMPLOYEE',
    CUSTOMER: 'CUSTOMER'
  };

  const CURRENCIES = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
    AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham' }
  };

  const API_ENDPOINTS = {
    AUTH_LOGIN: '/auth/login',
    AUTH_REGISTER: '/auth/register',
    AUTH_ME: '/auth/me',
    AUTH_SEND_OTP: '/auth/send-otp',
    AUTH_VERIFY_OTP: '/auth/verify-otp',
    AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
    AUTH_RESET_PASSWORD: '/auth/reset-password',
    ONBOARDING_APPLY: '/onboarding/apply',
    ONBOARDING_TRACK: '/onboarding/track',
    ONBOARDING_STATUS: '/onboarding/status',
    ACCOUNTS: '/accounts',
    TRANSFERS: '/transfers',
    CARDS: '/cards',
    LOANS: '/loans',
    DISPUTES: '/disputes',
    ADMIN: '/admin',
    DB_OVERVIEW: '/api/db/overview',
    DB_TABLE: '/api/db/table',
    DB_QUERY: '/api/db/query'
  };

  const STATUS_PILLS = {
    ACTIVE: { label: 'Active', class: 'status-active' },
    PENDING: { label: 'Pending', class: 'status-pending' },
    SUBMITTED: { label: 'Submitted', class: 'status-submitted' },
    UNDER_REVIEW: { label: 'Under Review', class: 'status-under_review' },
    APPROVED: { label: 'Approved', class: 'status-active' },
    ACCEPTED: { label: 'Accepted', class: 'status-active' },
    REJECTED: { label: 'Rejected', class: 'status-rejected' },
    FROZEN: { label: 'Frozen', class: 'status-frozen' }
  };

  const NeoBankConstants = {
    SUPPORTED_LANGUAGES,
    ACCOUNT_TYPES,
    USER_ROLES,
    CURRENCIES,
    API_ENDPOINTS,
    STATUS_PILLS
  };

  // Expose globally
  window.NeoBankConstants = NeoBankConstants;
  window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
  window.ACCOUNT_TYPES = ACCOUNT_TYPES;
  window.USER_ROLES = USER_ROLES;
  window.CURRENCIES = CURRENCIES;
  window.API_ENDPOINTS = API_ENDPOINTS;

})(typeof window !== 'undefined' ? window : this);
