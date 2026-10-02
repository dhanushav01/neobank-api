/**
 * NeoBank Core Banking Platform - Centralized Shared UI Components
 * Single source of truth for repeated UI elements: Header controls (Theme, Zoom, Language),
 * Brand badges, Status pills, Password field toggles, and Navigation docks.
 */
(function(window) {
  'use strict';

  /**
   * Generates the Theme Toggle Button HTML.
   */
  function createThemeToggleHtml() {
    return `
      <button type="button" class="theme-toggle-btn" onclick="toggleAppTheme()" aria-label="Toggle light and dark theme" title="Toggle Light/Dark Theme">
        <span class="theme-toggle-track">
          <span class="theme-toggle-indicator">
            <svg class="theme-toggle-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="m4.93 4.93 1.41 1.41"></path>
              <path d="m17.66 17.66 1.41 1.41"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="m6.34 17.66-1.41 1.41"></path>
              <path d="m19.07 4.93-1.41 1.41"></path>
            </svg>
            <svg class="theme-toggle-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
            </svg>
          </span>
        </span>
        <span class="theme-toggle-label">Dark</span>
      </button>
    `.trim();
  }

  /**
   * Generates the Page Zoom Controls HTML.
   */
  function createZoomControlsHtml() {
    return `
      <div class="page-zoom-controls">
        <button type="button" class="zoom-btn zoom-out-btn" onclick="zoomPageOut()" title="Zoom Out (Smaller Text -)" aria-label="Zoom out">−</button>
        <button type="button" class="zoom-btn zoom-reset-btn" onclick="resetPageZoom()" title="Reset Page Size (100%)" aria-label="Reset zoom">
          <span class="zoom-level-text">100%</span>
        </button>
        <button type="button" class="zoom-btn zoom-in-btn" onclick="zoomPageIn()" title="Zoom In (Larger Text +)" aria-label="Zoom in">+</button>
      </div>
    `.trim();
  }

  /**
   * Generates the Language Selector with SVG Country Flag HTML.
   */
  function createLanguageSelectorHtml() {
    const langs = (window.NeoBankConstants && window.NeoBankConstants.SUPPORTED_LANGUAGES) || [
      { code: 'en', native: 'English (EN)' },
      { code: 'es', native: 'Español (ES)' },
      { code: 'fr', native: 'Français (FR)' },
      { code: 'de', native: 'Deutsch (DE)' },
      { code: 'hi', native: 'हिन्दी (HI)' },
      { code: 'ar', native: 'العربية (AR)' },
      { code: 'zh-CN', native: '中文 (ZH)' },
      { code: 'ja', native: '日本語 (JA)' },
      { code: 'ru', native: 'Русский (RU)' },
      { code: 'pt', native: 'Português (PT)' }
    ];

    const optionsHtml = langs.map(l => 
      `<option value="${l.code}" ${l.code === 'en' ? 'selected' : ''} class="notranslate" translate="no">${l.native}</option>`
    ).join('');

    const usFlagSvg = `<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/><path fill="#192f5d" d="M0 0h256v258.5H0z"/><g fill="#fff"><circle cx="28" cy="24" r="6"/><circle cx="70" cy="24" r="6"/><circle cx="112" cy="24" r="6"/><circle cx="154" cy="24" r="6"/><circle cx="196" cy="24" r="6"/><circle cx="238" cy="24" r="6"/><circle cx="49" cy="48" r="6"/><circle cx="91" cy="48" r="6"/><circle cx="133" cy="48" r="6"/><circle cx="175" cy="48" r="6"/><circle cx="217" cy="48" r="6"/><circle cx="28" cy="72" r="6"/><circle cx="70" cy="72" r="6"/><circle cx="112" cy="72" r="6"/><circle cx="154" cy="72" r="6"/><circle cx="196" cy="72" r="6"/><circle cx="238" cy="72" r="6"/></g></svg>`;

    return `
      <div class="neobank-lang-wrap notranslate" translate="no" style="display:flex;align-items:center;gap:0.45rem;background:rgba(255,255,255,0.05);padding:0.35rem 0.65rem;border-radius:10px;border:1px solid var(--border-subtle)">
        <span class="neobank-lang-flag-icon" aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:15px;border-radius:2px;overflow:hidden;box-shadow:0 0 1px rgba(0,0,0,0.6);flex-shrink:0">${usFlagSvg}</span>
        <select class="neobank-lang-select notranslate form-select" translate="no" style="background:transparent;border:none;color:inherit;font-size:0.8rem;padding:0;cursor:pointer;outline:none" onchange="typeof handleLanguageChange === 'function' && handleLanguageChange(this)">
          ${optionsHtml}
        </select>
      </div>
    `.trim();
  }

  /**
   * Generates the Complete Header Controls HTML (Theme + Zoom + Language).
   */
  function createHeaderControlsHtml() {
    return `
      ${createThemeToggleHtml()}
      ${createZoomControlsHtml()}
      ${createLanguageSelectorHtml()}
    `.trim();
  }

  /**
   * Mounts the Header Controls into a target container.
   */
  function renderHeaderControls(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.innerHTML = createHeaderControlsHtml();
    }
  }

  /**
   * Generates the Brand Badge HTML.
   */
  function createBrandBadgeHtml(subtitle = 'Digital Banking') {
    return `
      <div class="brand-badge">
        <div class="brand-icon">
          <svg style="width:24px;height:24px;color:#fff" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5m-15 10.5V10.5" />
          </svg>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="brand-title">NeoBank</span>
            <span style="font-size:0.65rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:9999px;background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.3)">2026</span>
          </div>
          <div data-i18n="brand_sub" style="font-size:0.75rem;color:var(--text-muted)">${subtitle}</div>
        </div>
      </div>
    `.trim();
  }

  /**
   * Generates a Standardized Status Badge HTML.
   */
  function createStatusBadgeHtml(status, customCls = '') {
    const s = String(status || '').toUpperCase();
    const formatted = window.formatHumanText ? window.formatHumanText(s) : s;
    const cls = s.toLowerCase();
    return `<span class="status-pill ${cls} ${customCls}">${formatted}</span>`;
  }

  /**
   * Generates a Standardized Floating Action Bar for Desktop Navigation.
   */
  function createFloatingActionBarHtml() {
    return `
      <div id="neobank-floating-dock" class="neobank-floating-dock screen-only no-print" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;align-items:center;gap:0.5rem;background:rgba(15,23,42,0.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.15);border-radius:9999px;padding:0.4rem 0.75rem;box-shadow:0 12px 35px rgba(0,0,0,0.6)">
        <a href="/open_account_customer" class="dock-link" style="font-size:0.78rem;font-weight:700;color:#c7d2fe;text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Open Account</a>
        <span style="color:rgba(255,255,255,0.2)">|</span>
        <a href="/existing_application" class="dock-link" style="font-size:0.78rem;font-weight:700;color:#c7d2fe;text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Track Status</a>
        <span style="color:rgba(255,255,255,0.2)">|</span>
        <a href="/employee_onboarding" class="dock-link" style="font-size:0.78rem;font-weight:700;color:#c7d2fe;text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Staff Portal</a>
        <span style="color:rgba(255,255,255,0.2)">|</span>
        <a href="/login" class="dock-link" style="font-size:0.78rem;font-weight:700;color:#38bdf8;text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Login</a>
      </div>
    `.trim();
  }

  /**
   * Generates the Standardized Page Footer HTML.
   */
  function createFooterHtml() {
    return `
      <footer style="padding:2.5rem 1.5rem;font-size:0.8rem;border-top:1px solid var(--border-subtle);background:transparent">
        <div style="max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:space-between;gap:2rem">
          <div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
              <span style="font-size:1.1rem;font-weight:800;color:var(--text-main)">NeoBank</span>
              <span style="font-size:0.65rem;color:var(--brand-500);border:1px solid rgba(99,102,241,0.3);padding:0.1rem 0.4rem;border-radius:9999px">FINTECH 2026</span>
            </div>
            <p style="max-width:320px;line-height:1.5;color:var(--text-secondary)">
              Licensed and regulated financial technology institution. Deposits held at FDIC-insured partner banks. Documents stored under AES-256 vault encryption.
            </p>
          </div>
          <div style="display:flex;gap:3rem;flex-wrap:wrap">
            <div>
              <div style="font-weight:700;color:var(--text-main);margin-bottom:0.6rem">Services</div>
              <ul style="list-style:none;display:flex;flex-direction:column;gap:0.4rem;padding:0;margin:0">
                <li><a href="/open_account_customer" style="color:var(--text-secondary);text-decoration:none">Open Account</a></li>
                <li><a href="/existing_application" style="color:var(--text-secondary);text-decoration:none">Track Application</a></li>
                <li><a href="/login" style="color:var(--text-secondary);text-decoration:none">Existing User Login</a></li>
              </ul>
            </div>
            <div>
              <div style="font-weight:700;color:var(--text-main);margin-bottom:0.6rem">Institutional</div>
              <ul style="list-style:none;display:flex;flex-direction:column;gap:0.4rem;padding:0;margin:0">
                <li><a href="/employee_onboarding" style="color:var(--text-secondary);text-decoration:none">Bank Employee Portal</a></li>
                <li><a href="/sql-gui" style="color:var(--text-secondary);text-decoration:none">SQL Database GUI</a></li>
                <li><a href="/docs" style="color:var(--text-secondary);text-decoration:none">Swagger API Docs</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div style="max-width:1200px;margin:2rem auto 0;padding-top:1.5rem;border-top:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;color:var(--text-muted)">
          <div>&copy; 2026 NeoBank Core Banking Technologies. All rights reserved.</div>
        </div>
      </footer>
    `.trim();
  }

  // Auto-render declarative components on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Auto-mount header controls into designated slots
    document.querySelectorAll('[data-component="header-controls"]').forEach(slot => {
      if (!slot.hasChildNodes() || slot.innerHTML.trim() === '') {
        slot.innerHTML = createHeaderControlsHtml();
      }
    });

    // Auto-mount brand badges
    document.querySelectorAll('[data-component="brand-badge"]').forEach(slot => {
      if (!slot.hasChildNodes() || slot.innerHTML.trim() === '') {
        const sub = slot.getAttribute('data-subtitle') || 'Digital Banking';
        slot.innerHTML = createBrandBadgeHtml(sub);
      }
    });

    // Auto-mount footer
    document.querySelectorAll('[data-component="app-footer"]').forEach(slot => {
      if (!slot.hasChildNodes() || slot.innerHTML.trim() === '') {
        slot.innerHTML = createFooterHtml();
      }
    });
  });

  const NeoBankComponents = {
    createThemeToggleHtml,
    createZoomControlsHtml,
    createLanguageSelectorHtml,
    createHeaderControlsHtml,
    renderHeaderControls,
    createBrandBadgeHtml,
    createStatusBadgeHtml,
    createFloatingActionBarHtml,
    createFooterHtml
  };

  window.NeoBankComponents = NeoBankComponents;

})(typeof window !== 'undefined' ? window : this);
