/**
 * NeoBank Global Multi-Culture Theme Manager
 * Controls both Culture Themes (17 authentic global cultures) & Theme Modes (Dark/Light).
 * Runs synchronously in <head> to prevent FOUC / layout shift.
 * Exposes window.NeobankTheme API for charts, canvas, and components.
 */

(function(window, document) {
  'use strict';

  const STORAGE_THEME_KEY = 'neobank_theme';
  const STORAGE_LANG_KEY = 'neobank_lang';
  const listeners = [];

  const CULTURES_META = {
    en: { name: 'English', native: 'English', flag: 'US', defaultDir: 'ltr' },
    es: { name: 'Spanish', native: 'Español', flag: 'ES', defaultDir: 'ltr' },
    fr: { name: 'French', native: 'Français', flag: 'FR', defaultDir: 'ltr' },
    de: { name: 'German', native: 'Deutsch', flag: 'DE', defaultDir: 'ltr' },
    hi: { name: 'Hindi', native: 'हिन्दी', flag: 'IN', defaultDir: 'ltr' },
    ar: { name: 'Arabic', native: 'العربية', flag: 'SA', defaultDir: 'rtl' },
    zh: { name: 'Chinese', native: '中文', flag: 'CN', defaultDir: 'ltr' },
    'zh-CN': { name: 'Chinese', native: '中文', flag: 'CN', defaultDir: 'ltr' },
    ja: { name: 'Japanese', native: '日本語', flag: 'JP', defaultDir: 'ltr' },
    ru: { name: 'Russian', native: 'Русский', flag: 'RU', defaultDir: 'ltr' },
    pt: { name: 'Portuguese', native: 'Português', flag: 'PT', defaultDir: 'ltr' },
    it: { name: 'Italian', native: 'Italiano', flag: 'IT', defaultDir: 'ltr' },
    ko: { name: 'Korean', native: '한국어', flag: 'KR', defaultDir: 'ltr' },
    tr: { name: 'Turkish', native: 'Türkçe', flag: 'TR', defaultDir: 'ltr' },
    nl: { name: 'Dutch', native: 'Nederlands', flag: 'NL', defaultDir: 'ltr' },
    bn: { name: 'Bengali', native: 'বাংলা', flag: 'BD', defaultDir: 'ltr' },
    ta: { name: 'Tamil', native: 'தமிழ்', flag: 'IN', defaultDir: 'ltr' },
    te: { name: 'Telugu', native: 'తెలుగు', flag: 'IN', defaultDir: 'ltr' },
    he: { name: 'Hebrew', native: 'עברית', flag: 'IL', defaultDir: 'rtl' },
    fa: { name: 'Persian', native: 'فارسی', flag: 'IR', defaultDir: 'rtl' },
    ur: { name: 'Urdu', native: 'اردو', flag: 'PK', defaultDir: 'rtl' }
  };

  function normalizeCulture(code) {
    if (!code) return 'en';
    const c = String(code).trim();
    if (c === 'zh-CN' || c === 'zh') return 'zh';
    return CULTURES_META[c] ? c : 'en';
  }

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function getSavedCulture() {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) || localStorage.getItem('neobank_culture');
      return normalizeCulture(saved);
    } catch (e) {
      return 'en';
    }
  }

  function updateMetaThemeColor() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    const color = window.NeobankTheme.getThemeColor('--meta-theme-color') || 
                  (getSavedTheme() === 'light' ? '#ffffff' : '#07090e');
    meta.setAttribute('content', color);
  }

  function applyCultureAndTheme(culture, theme) {
    const normCulture = normalizeCulture(culture);
    const targetTheme = (theme === 'light') ? 'light' : 'dark';

    // Set attributes on root HTML tag
    document.documentElement.setAttribute('data-culture', normCulture);
    document.documentElement.setAttribute('data-theme', targetTheme);
    const isRtl = ['ar', 'fa', 'ur', 'he'].includes(normCulture) || ['ar', 'fa', 'ur', 'he'].includes(culture);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.style.colorScheme = targetTheme;

    // Synchronize legacy body classes
    if (document.body) {
      if (targetTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      }
    }

    // Synchronize theme toggle buttons
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.setAttribute('data-current-theme', targetTheme);
      btn.setAttribute('aria-pressed', targetTheme === 'light' ? 'true' : 'false');
      btn.setAttribute('title', targetTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
      const label = btn.querySelector('.theme-toggle-label');
      if (label) {
        label.textContent = targetTheme === 'light' ? 'Light' : 'Dark';
      }
    });

    // Synchronize legacy selects
    document.querySelectorAll('.theme-select').forEach(select => {
      select.value = targetTheme;
    });

    // Update browser chrome
    updateMetaThemeColor();

    // Notify registered listeners
    listeners.forEach(fn => {
      try {
        fn({ culture: normCulture, theme: targetTheme });
      } catch (e) {
        console.error('Error in theme listener:', e);
      }
    });

    // Dispatch global event
    try {
      window.dispatchEvent(new CustomEvent('neobank:themechange', {
        detail: { culture: normCulture, theme: targetTheme }
      }));
    } catch (e) {}
  }

  // Define public NeobankTheme API
  window.NeobankTheme = {
    CULTURES: CULTURES_META,

    getCulture: function() {
      return document.documentElement.getAttribute('data-culture') || getSavedCulture();
    },

    getTheme: function() {
      return document.documentElement.getAttribute('data-theme') || getSavedTheme();
    },

    setCulture: function(culture) {
      const norm = normalizeCulture(culture);
      try {
        localStorage.setItem(STORAGE_LANG_KEY, norm);
        localStorage.setItem('neobank_culture', norm);
      } catch (e) {}
      applyCultureAndTheme(norm, this.getTheme());
    },

    setTheme: function(theme) {
      const targetTheme = (theme === 'light') ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_THEME_KEY, targetTheme);
      } catch (e) {}
      applyCultureAndTheme(this.getCulture(), targetTheme);
    },

    toggleTheme: function() {
      const current = this.getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      this.setTheme(next);
      return next;
    },

    getThemeColor: function(varName) {
      if (!varName) return '';
      const name = varName.startsWith('--') ? varName : `--${varName}`;
      try {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      } catch (e) {
        return '';
      }
    },

    subscribe: function(callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
      return function unsubscribe() {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
      };
    },

    onThemeChange: function(callback) {
      return this.subscribe(callback);
    }
  };

  // Legacy API mappings for backward compatibility
  window.setAppTheme = function(theme) {
    window.NeobankTheme.setTheme(theme);
  };

  window.toggleAppTheme = function() {
    window.NeobankTheme.toggleTheme();
  };

  // Immediate synchronous execution in <head> to prevent flicker
  applyCultureAndTheme(getSavedCulture(), getSavedTheme());

  // Re-synchronize once DOM is loaded to ensure all buttons and meta tags exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      applyCultureAndTheme(getSavedCulture(), getSavedTheme());
    });
  } else {
    applyCultureAndTheme(getSavedCulture(), getSavedTheme());
  }

})(window, document);
