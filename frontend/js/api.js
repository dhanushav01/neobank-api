/**
 * NeoBank API Client & Notification Engine
 */

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
window.formatHumanText = formatHumanText;

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
window.replaceUnderscoreWords = replaceUnderscoreWords;

// Dynamic API Base URL resolution:
// - Standalone frontend dev servers (Live Server on 5500, Vite on 5173/3000, 8080) or local file protocol route to http://127.0.0.1:8000.
// - Cloud hosted platforms (Render, Railway, etc.) or when served directly from FastAPI route to window.location.origin.
const isSeparateDevServer = 
  ['5500', '3000', '5173', '8080'].includes(window.location.port) || 
  window.location.protocol === 'file:';

const API_BASE = isSeparateDevServer 
  ? 'http://127.0.0.1:8000' 
  : window.location.origin;

window.API_BASE = API_BASE;

// Global Token Management
function getToken() {
  return localStorage.getItem('neobank_token') || '';
}
window.getToken = getToken;

function setToken(token) {
  if (token) {
    localStorage.setItem('neobank_token', token);
  } else {
    localStorage.removeItem('neobank_token');
  }
}
window.setToken = setToken;

function getCurrentUserSession() {
  try {
    const raw = localStorage.getItem('neobank_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
window.getCurrentUserSession = getCurrentUserSession;

function setCurrentUserSession(userData) {
  if (userData) {
    localStorage.setItem('neobank_user', JSON.stringify(userData));
  } else {
    localStorage.removeItem('neobank_user');
  }
}
window.setCurrentUserSession = setCurrentUserSession;

// Unified API Caller
async function api(path, options = {}) {
  options.headers = options.headers || {};
  
  const token = getToken();
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, options);
    
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data.message || `API Error (${response.status})`;
      showToast(errMsg, 'error');
      
      // Auto logout if 401 unauthenticated
      if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register') && !path.includes('/auth/forgot-password')) {
        setToken(null);
        setCurrentUserSession(null);
        localStorage.removeItem('neobank_token');
        localStorage.removeItem('neobank_user');
        window.location.href = '/login';
      }
      
      throw { status: response.status, ...data };
    }

    return data;
  } catch (error) {
    console.error(`Request to ${path} failed:`, error);
    throw error;
  }
}
window.api = api;

// Toast Alert System
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg style="width:20px;height:20px;color:var(--emerald-400);flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg style="width:20px;height:20px;color:var(--rose-500);flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
  } else {
    iconSvg = `<svg style="width:20px;height:20px;color:var(--brand-500);flex-shrink:0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
window.showToast = showToast;

// Modal open/close helpers with dynamic z-index stacking (ensures child/nested popups are never hidden in background)
let globalModalZIndexCounter = 100000;

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    let highestZ = globalModalZIndexCounter;
    try {
      document.querySelectorAll('.modal-overlay.active').forEach(m => {
        if (m !== el) {
          const compZ = parseInt(window.getComputedStyle(m).zIndex, 10);
          if (!isNaN(compZ) && compZ > highestZ) {
            highestZ = compZ;
          }
        }
      });
    } catch (e) {}

    globalModalZIndexCounter = Math.max(globalModalZIndexCounter + 20, highestZ + 20);
    el.style.setProperty('z-index', String(globalModalZIndexCounter), 'important');
    el.style.setProperty('display', 'flex', 'important');
    requestAnimationFrame(() => {
      el.classList.add('active');
    });
  }
}
window.openModal = openModal;

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.classList.remove('active');
    setTimeout(() => {
      if (!el.classList.contains('active')) {
        el.style.removeProperty('display');
        el.style.display = 'none';
      }
    }, 220);
  }
}
window.closeModal = closeModal;

/**
 * Continuous DOM sanitizer to ensure NO raw underscores appear in UI labels,
 * text nodes, status pills, table cells, or badges throughout the entire application.
 */
function sanitizeUnderscoresInDOM(root = document.body) {
  if (!root || typeof document === 'undefined' || window._isSanitizingDOM) return;
  window._isSanitizingDOM = true;

  try {
    // 1. Text node traversal via TreeWalker for high performance & universal coverage
    if (document.createTreeWalker) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            if (!node || !node.nodeValue || !node.nodeValue.includes('_')) {
              return NodeFilter.FILTER_REJECT;
            }
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (['script', 'style', 'code', 'pre', 'textarea'].includes(tag)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest('.notranslate, select.neobank-lang-select, code, pre, script, style')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      for (const node of textNodes) {
        const orig = node.nodeValue;
        const replaced = replaceUnderscoreWords(orig);
        if (orig !== replaced) {
          node.nodeValue = replaced;
        }
      }
    }

    // 2. Target specific elements that might contain underscores
    root.querySelectorAll('.status-pill, .role-badge, [data-humanize], td, th, strong, b, span, p, h1, h2, h3, h4, h5, h6, .tag, .badge, label').forEach(el => {
      if (el.children.length === 0 && el.textContent && el.textContent.includes('_')) {
        const text = el.textContent.trim();
        if (!text.includes('@') && !text.includes('/') && !text.includes('\\') && !text.startsWith('http') && !/^[0-9a-f]{8}-/i.test(text)) {
          if (!el.closest('script, style, code, pre, .notranslate, select.neobank-lang-select')) {
            const formatted = replaceUnderscoreWords(text);
            if (el.textContent !== formatted) {
              el.textContent = formatted;
            }
          }
        }
      }
    });

    // 3. Format select option labels to clean human readable text
    root.querySelectorAll('option').forEach(opt => {
      if (opt.closest('.neobank-lang-select')) return;
      if (opt.textContent && opt.textContent.includes('_')) {
        const formatted = replaceUnderscoreWords(opt.textContent);
        if (opt.textContent !== formatted) {
          opt.textContent = formatted;
        }
      }
    });

    // 4. Sanitize input placeholders with underscores
    root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      const ph = el.getAttribute('placeholder');
      if (ph && ph.includes('_') && !ph.includes('@')) {
        const formatted = replaceUnderscoreWords(ph);
        if (ph !== formatted) {
          el.setAttribute('placeholder', formatted);
        }
      }
    });
  } finally {
    window._isSanitizingDOM = false;
  }
}
window.sanitizeUnderscoresInDOM = sanitizeUnderscoresInDOM;

// Observe DOM updates to automatically sanitize any dynamic data with underscores
if (typeof MutationObserver !== 'undefined') {
  let sanitizeTimeout = null;
  const debouncedSanitize = () => {
    if (sanitizeTimeout) clearTimeout(sanitizeTimeout);
    sanitizeTimeout = setTimeout(() => {
      sanitizeUnderscoresInDOM();
    }, 120);
  };

  const sanitizeObserver = new MutationObserver(debouncedSanitize);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      sanitizeUnderscoresInDOM();
      if (document.body) {
        sanitizeObserver.observe(document.body, { childList: true, subtree: true });
      }
    });
  } else {
    sanitizeUnderscoresInDOM();
    if (document.body) {
      sanitizeObserver.observe(document.body, { childList: true, subtree: true });
    }
  }
}
