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
  function createThemeToggleHtml(testIdPrefix = 'shared') {
    return `
      <button type="button" class="theme-toggle-btn" onclick="toggleAppTheme()" aria-label="Toggle light and dark theme" title="Toggle Light/Dark Theme" data-testid="${testIdPrefix}-nav-theme-button">
        <span class="theme-toggle-track">
          <span class="theme-toggle-indicator">
            <svg class="theme-toggle-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4"></circle>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
            </svg>
            <svg class="theme-toggle-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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
  function createZoomControlsHtml(testIdPrefix = 'shared') {
    return `
      <div class="page-zoom-controls" data-testid="${testIdPrefix}-nav-zoom-controls">
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
  function createLanguageSelectorHtml(testIdPrefix = 'shared') {
    return `
      <div id="neobank-lang-container" class="notranslate" translate="no" data-testid="${testIdPrefix}-nav-lang-container"></div>
      <div id="google_translate_element" class="notranslate" translate="no" style="display:none!important;" data-testid="${testIdPrefix}-nav-translate-element"></div>
    `.trim();
  }

  /**
   * Generates the Complete Header Controls HTML (Theme + Zoom + Language).
   */
  function createHeaderControlsHtml(testIdPrefix = 'shared') {
    return `
      ${createThemeToggleHtml(testIdPrefix)}
      ${createZoomControlsHtml(testIdPrefix)}
      ${createLanguageSelectorHtml(testIdPrefix)}
    `.trim();
  }

  /**
   * Mounts the Header Controls into a target container.
   */
  function renderHeaderControls(target, testIdPrefix = 'shared') {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (el) {
      el.innerHTML = createHeaderControlsHtml(testIdPrefix);
      if (window.NeoBankI18n && typeof window.NeoBankI18n.initLanguageDropdown === 'function') {
        window.NeoBankI18n.initLanguageDropdown();
      }
      if (window.updateThemeToggleVisuals && typeof window.updateThemeToggleVisuals === 'function') {
        window.updateThemeToggleVisuals();
      }
      if (window.updateZoomDisplay && typeof window.updateZoomDisplay === 'function') {
        window.updateZoomDisplay();
      }
    }
  }

  /**
   * Generates the Brand Badge HTML.
   */
  function createBrandBadgeHtml(subtitle = 'Digital Banking') {
    return `
      <div class="brand-badge">
        <div class="brand-icon">
          <svg style="width:24px;height:24px;color:var(--text-contrast)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5m-15 10.5V10.5" />
          </svg>
        </div>
        <div>
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span class="brand-title">NeoBank</span>
            <span style="font-size:0.65rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:9999px;background:var(--brand-subtle);color:var(--brand-300);border:1px solid var(--border-glow)">Quantum</span>
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
      <div id="neobank-floating-dock" class="neobank-floating-dock screen-only no-print" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;align-items:center;gap:0.5rem;background:rgba(15,23,42,0.92);backdrop-filter:blur(16px);border:1px solid var(--bg-subtle);border-radius:9999px;padding:0.4rem 0.75rem;box-shadow:0 12px 35px rgba(0,0,0,0.6)">
        <a href="/open_account_customer" class="dock-link" style="font-size:0.78rem;font-weight:700;color:var(--brand-200);text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Open Account</a>
        <span style="color:rgba(255,255,255,0.2)">|</span>
        <a href="/existing_application" class="dock-link" style="font-size:0.78rem;font-weight:700;color:var(--brand-200);text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Track Status</a>
        <span style="color:rgba(255,255,255,0.2)">|</span>
        <a href="/employee_onboarding" class="dock-link" style="font-size:0.78rem;font-weight:700;color:var(--brand-200);text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Staff Portal</a>
        <span style="color:rgba(255,255,255,0.2)">|</span>
        <a href="/login" class="dock-link" style="font-size:0.78rem;font-weight:700;color:var(--sky-400);text-decoration:none;padding:0.35rem 0.65rem;border-radius:9999px;transition:all 0.2s">Login</a>
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
              <span style="font-size:0.65rem;color:var(--brand-500);border:1px solid var(--border-glow);padding:0.1rem 0.4rem;border-radius:9999px">FINTECH QUANTUM</span>
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
          <div>&copy; NeoBank Core Banking Technologies. All rights reserved.</div>
        </div>
      </footer>
    `.trim();
  }

  function autoMountHeaderControls() {
    document.querySelectorAll('[data-component="header-controls"], .nav-controls[data-shared-controls]').forEach(slot => {
      if (!slot.hasChildNodes() || slot.innerHTML.trim() === '') {
        const testId = slot.getAttribute('data-testid') || '';
        const prefix = slot.getAttribute('data-testid-prefix') || 
                       (testId.indexOf('-nav-controls') !== -1 ? testId.replace('-nav-controls', '') : 
                       (slot.id ? slot.id.replace('-controls', '') : 'shared'));
        renderHeaderControls(slot, prefix);
      }
    });
  }

  // Auto-render declarative components on DOMContentLoaded or immediately if ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      autoMountHeaderControls();
    });
  } else {
    autoMountHeaderControls();
  }

  document.addEventListener('DOMContentLoaded', () => {

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
