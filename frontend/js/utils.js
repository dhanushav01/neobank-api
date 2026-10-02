/**
 * NeoBank Core Banking Platform - Centralized Shared Utilities
 * Single source of truth for text formatting, HTML escaping, password toggling,
 * date validation, clipboard copying, and input error state cleanup.
 */
(function(window) {
  'use strict';

  /**
   * Universal Human-Readable Formatter
   * Converts system format tokens (e.g. MONEY_ORDER, SAVINGS_ACCOUNT, UNDER_REVIEW)
   * into clean, readable Title Case text (e.g. Money Order, Savings Account, Under Review).
   */
  function formatHumanText(val) {
    if (!val || typeof val !== 'string') return val || '';
    const trimmed = val.trim();

    // Preserve URLs, emails, numbers/currencies, and UUIDs/hashes
    if (trimmed.startsWith('http') || trimmed.includes('@') || /^\$?[0-9]/.test(trimmed) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(trimmed)) {
      return val;
    }

    // Check if string contains underscore OR is an all-caps enum string
    if (trimmed.includes('_') || (/^[A-Z0-9_]{3,}$/.test(trimmed) && trimmed === trimmed.toUpperCase())) {
      return trimmed
        .split('_')
        .filter(Boolean)
        .map(part => {
          const upper = part.toUpperCase();
          if (['ID', 'KYC', 'OTP', 'APY', 'NRI', 'ATM', 'USD', 'EUR', 'GBP'].includes(upper)) {
            return upper;
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(' ');
    }
    return val;
  }

  /**
   * Replaces any words containing underscores in arbitrary sentences or phrases
   * with clean human-readable words (e.g. "Payment via MONEY_ORDER" -> "Payment via Money Order").
   */
  function replaceUnderscoreWords(text) {
    if (!text || typeof text !== 'string' || !text.includes('_')) return text;
    if (text.includes('@') || text.startsWith('http') || text.includes('://')) return text;

    return text.replace(/\b([A-Za-z0-9]+(?:_[A-Za-z0-9]+)+)\b/g, (match) => {
      // If it's a UUID or hexadecimal hash or purely digits, preserve it
      if (/^[0-9a-f]{8,}/i.test(match) || /^[0-9_]+$/.test(match)) return match;
      return formatHumanText(match);
    });
  }

  /**
   * Escapes HTML special characters for safe DOM insertion.
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Escapes string for safe HTML attribute insertion.
   */
  function escapeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }

  /**
   * Centralized Password Visibility Toggling with SVG Eye Icon.
   * Toggles input type between 'password' and 'text'.
   */
  function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPw = input.type === 'password';
    input.type = isPw ? 'text' : 'password';

    const eyeOpenSvg = '<svg style="width:18px;height:18px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';
    const eyeSlashSvg = '<svg style="width:18px;height:18px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>';

    if (btn) {
      btn.innerHTML = isPw ? eyeSlashSvg : eyeOpenSvg;
      btn.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
    }
  }

  /**
   * Validates date range: disallows future dates and dates prior to minYear (default 1900).
   * Returns { valid: boolean, error: string|null, date: Date|null }.
   */
  function validateDateRange(val, minYear = 1900) {
    if (!val) return { valid: false, error: 'Date is required', date: null };

    let yyyy, mm, dd;
    if (val.includes('-')) {
      const parts = val.split('-');
      yyyy = parseInt(parts[0], 10);
      mm = parseInt(parts[1], 10);
      dd = parseInt(parts[2], 10);
    } else if (val.length === 8) {
      dd = parseInt(val.slice(0, 2), 10);
      mm = parseInt(val.slice(2, 4), 10);
      yyyy = parseInt(val.slice(4, 8), 10);
    } else {
      return { valid: false, error: 'Invalid date format', date: null };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const chosenDate = new Date(yyyy, mm - 1, dd);

    if (yyyy < minYear) {
      return { valid: false, error: `Date cannot be earlier than ${minYear}`, date: chosenDate };
    }
    if (chosenDate > today) {
      return { valid: false, error: 'Date cannot be in the future', date: chosenDate };
    }

    return { valid: true, error: null, date: chosenDate };
  }

  /**
   * Formats a number into a currency string (e.g. $1,250.00).
   */
  function formatCurrency(amount, currency = 'USD') {
    const num = Number(amount) || 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(num);
    } catch (e) {
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
  }

  /**
   * Copies text to the clipboard with toast feedback.
   */
  function copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (typeof window.showToast === 'function') {
          window.showToast(successMsg, 'success');
        }
      }).catch(() => {
        _legacyCopy(text, successMsg);
      });
    } else {
      _legacyCopy(text, successMsg);
    }
  }

  function _legacyCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (typeof window.showToast === 'function') {
        window.showToast(successMsg, 'success');
      }
    } catch (e) {}
    document.body.removeChild(ta);
  }

  /**
   * Clears error styling and error messages when a valid input value is entered.
   */
  function clearErrorOnValidInput(target) {
    if (!target) return;
    const val = (target.value || '').trim();
    if (val.length > 0) {
      target.classList.remove('input-error');
      target.style.removeProperty('border-color');
      target.style.removeProperty('box-shadow');

      // Clear adjacent or child error messages
      const parent = target.closest('.form-group, .cell-input-wrap, .field-wrapper') || target.parentElement;
      if (parent) {
        const errMsg = parent.querySelector('.field-error-msg, .error-hint, .validation-message');
        if (errMsg) errMsg.remove();
      }
    }
  }

  const NeoBankUtils = {
    formatHumanText,
    replaceUnderscoreWords,
    escapeHtml,
    escapeAttr,
    togglePasswordVisibility,
    validateDateRange,
    formatCurrency,
    copyToClipboard,
    clearErrorOnValidInput
  };

  // Expose both on namespace and on window for direct backwards compatibility
  window.NeoBankUtils = NeoBankUtils;
  window.formatHumanText = formatHumanText;
  window.replaceUnderscoreWords = replaceUnderscoreWords;
  window.escapeHtml = escapeHtml;
  window.escapeAttr = escapeAttr;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.validateDateRange = validateDateRange;
  window.formatCurrency = formatCurrency;
  window.copyToClipboard = copyToClipboard;
  window.clearErrorOnValidInput = clearErrorOnValidInput;

})(typeof window !== 'undefined' ? window : this);
