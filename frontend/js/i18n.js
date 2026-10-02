/**
 * NeoBank Global Translation & Internationalization Engine
 * Powered by Google Website Translator with silent DOM translation.
 * Completely eliminates Google Translate banner/toolbar iframes and provides
 * smooth frosted-glass transitions without any white screen flashes when switching languages
 * or refreshing the page.
 */

// Vector SVG Country Flags Map for 100% Cross-Platform Consistency
const COUNTRY_FLAGS_SVG = {
  US: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/><path fill="#192f5d" d="M0 0h256v258.5H0z"/><g fill="#fff"><circle cx="28" cy="24" r="6"/><circle cx="70" cy="24" r="6"/><circle cx="112" cy="24" r="6"/><circle cx="154" cy="24" r="6"/><circle cx="196" cy="24" r="6"/><circle cx="238" cy="24" r="6"/><circle cx="49" cy="48" r="6"/><circle cx="91" cy="48" r="6"/><circle cx="133" cy="48" r="6"/><circle cx="175" cy="48" r="6"/><circle cx="217" cy="48" r="6"/><circle cx="28" cy="72" r="6"/><circle cx="70" cy="72" r="6"/><circle cx="112" cy="72" r="6"/><circle cx="154" cy="72" r="6"/><circle cx="196" cy="72" r="6"/><circle cx="238" cy="72" r="6"/></g></svg>',
  ES: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#c60b1e" d="M0 0h640v480H0z"/><path fill="#ffc400" d="M0 120h640v240H0z"/><circle cx="160" cy="240" r="32" fill="#c60b1e"/></svg>',
  FR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#002654" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/></svg>',
  DE: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#000" d="M0 0h640v160H0z"/><path fill="#dd0000" d="M0 160h640v160H0z"/><path fill="#ffce00" d="M0 320h640v160H0z"/></svg>',
  IN: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#f93" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#128807" d="M0 320h640v160H0z"/><circle cx="320" cy="240" r="44" fill="none" stroke="#008" stroke-width="7"/><circle cx="320" cy="240" r="10" fill="#008"/></svg>',
  SA: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006c35" d="M0 0h640v480H0z"/><path fill="#fff" d="M160 270h320v15H160z"/><circle cx="320" cy="220" r="30" fill="none" stroke="#fff" stroke-width="6"/></svg>',
  CN: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#de2910" d="M0 0h640v480H0z"/><polygon fill="#ffde00" points="100,50 115,95 160,95 125,120 140,165 100,135 60,165 75,120 40,95 85,95"/></svg>',
  JP: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><circle cx="320" cy="240" r="120" fill="#bc002d"/></svg>',
  RU: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v160H0z"/><path fill="#0039a6" d="M0 160h640v160H0z"/><path fill="#d52b1e" d="M0 320h640v160H0z"/></svg>',
  PT: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006600" d="M0 0h256v480H0z"/><path fill="#ff0000" d="M256 0h384v480H256z"/><circle cx="256" cy="240" r="50" fill="#ffff00"/></svg>',
  IT: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#009246" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce2b37" d="M426.7 0H640v480H426.7z"/></svg>',
  KR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#cd2e3a" d="M320 140a100 100 0 0 1 0 200 50 50 0 0 1 0-100 50 50 0 0 0 0-100z"/><path fill="#0047a0" d="M320 240a50 50 0 0 1 0 100 100 100 0 0 1 0-200 50 50 0 0 0 0 100z"/></svg>',
  TR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#e30a17" d="M0 0h640v480H0z"/><circle cx="280" cy="240" r="90" fill="#fff"/><circle cx="305" cy="240" r="72" fill="#e30a17"/><polygon fill="#fff" points="380,240 410,250 395,225 410,205 385,215 365,195 370,225 350,240 375,245 375,270"/></svg>',
  NL: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ae1c28" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#21468b" d="M0 320h640v160H0z"/></svg>',
  BD: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006a4e" d="M0 0h640v480H0z"/><circle cx="290" cy="240" r="110" fill="#f42a41"/></svg>'
};

function getFlagSvgForLang(code) {
  const lang = (code || 'en').toLowerCase();
  if (lang === 'es') return COUNTRY_FLAGS_SVG.ES;
  if (lang === 'fr') return COUNTRY_FLAGS_SVG.FR;
  if (lang === 'de') return COUNTRY_FLAGS_SVG.DE;
  if (['hi', 'ta', 'te'].includes(lang)) return COUNTRY_FLAGS_SVG.IN;
  if (lang === 'ar') return COUNTRY_FLAGS_SVG.SA;
  if (lang.startsWith('zh')) return COUNTRY_FLAGS_SVG.CN;
  if (lang === 'ja') return COUNTRY_FLAGS_SVG.JP;
  if (lang === 'ru') return COUNTRY_FLAGS_SVG.RU;
  if (lang === 'pt') return COUNTRY_FLAGS_SVG.PT;
  if (lang === 'it') return COUNTRY_FLAGS_SVG.IT;
  if (lang === 'ko') return COUNTRY_FLAGS_SVG.KR;
  if (lang === 'tr') return COUNTRY_FLAGS_SVG.TR;
  if (lang === 'nl') return COUNTRY_FLAGS_SVG.NL;
  if (lang === 'bn') return COUNTRY_FLAGS_SVG.BD;
  return COUNTRY_FLAGS_SVG.US;
}

function updateLanguageFlagIcons(targetLang) {
  const code = targetLang || getCurrentLanguage() || 'en';
  const flagSvg = getFlagSvgForLang(code);
  document.querySelectorAll('.neobank-lang-flag-icon').forEach(iconEl => {
    iconEl.innerHTML = flagSvg;
  });
}

// Supported Languages Map (Clean text labels without emoji prefixes that render as text on desktop)
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English (EN)', country: 'US' },
  { code: 'es', label: 'Español (ES)', country: 'ES' },
  { code: 'fr', label: 'Français (FR)', country: 'FR' },
  { code: 'de', label: 'Deutsch (DE)', country: 'DE' },
  { code: 'hi', label: 'हिन्दी (HI)', country: 'IN' },
  { code: 'ar', label: 'العربية (AR)', country: 'SA' },
  { code: 'zh-CN', label: '中文 (ZH)', country: 'CN' },
  { code: 'ja', label: '日本語 (JA)', country: 'JP' },
  { code: 'ru', label: 'Русский (RU)', country: 'RU' },
  { code: 'pt', label: 'Português (PT)', country: 'PT' },
  { code: 'it', label: 'Italiano (IT)', country: 'IT' },
  { code: 'ko', label: '한국어 (KO)', country: 'KR' },
  { code: 'tr', label: 'Türkçe (TR)', country: 'TR' },
  { code: 'nl', label: 'Nederlands (NL)', country: 'NL' },
  { code: 'bn', label: 'বাংলা (BN)', country: 'BD' },
  { code: 'ta', label: 'தமிழ் (TA)', country: 'IN' },
  { code: 'te', label: 'తెలుగు (TE)', country: 'IN' }
];

const CANARY_ID = 'neobank-translate-canary';
const ORIGINAL_CANARY_TEXT = 'Digital Banking Platform';

// Pre-activate frosted blur immediately if non-English language is detected from cookie/storage
(function preActivateTransition() {
  try {
    const local = localStorage.getItem('neobank_lang');
    if (local === 'en') {
      // User explicitly wants English; purge any stray cookies immediately
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/;';
      document.cookie = 'googtrans=none; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/;';
      return;
    }
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z-]+)/);
    const lang = (match && match[1] && match[1] !== 'en') ? match[1] : local;
    if (lang && lang !== 'en') {
      const style = document.createElement('style');
      style.id = 'neobank-early-blur';
      style.textContent = `
        main, #screen-auth, .dashboard-container, #wizard-section { filter: blur(12px) saturate(1.15) !important; opacity: 0.65 !important; }
      `;
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          if (document.head && !document.getElementById('neobank-early-blur')) {
            document.head.appendChild(style);
          }
        });
      }
      // Fail-safe auto-unblur: never leave the screen stuck blurred for more than 1.8s
      setTimeout(() => {
        const s = document.getElementById('neobank-early-blur');
        if (s) s.remove();
        if (typeof hideTransitionMask === 'function') hideTransitionMask();
      }, 1800);
    }
  } catch (e) {}
})();

// Helper to clear all translation cookies thoroughly across paths and hostnames
function clearAllTranslateCookies() {
  const host = window.location.hostname;
  const isIp = /^(\d+\.){3}\d+$/.test(host);
  
  const hostParts = host.split('.');
  while (hostParts.length > 2) hostParts.shift();
  const parentDomain = hostParts.join('.');

  const paths = ['/', window.location.pathname, ''];
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  let acc = '';
  pathSegments.forEach(s => {
    acc += '/' + s;
    paths.push(acc);
    paths.push(acc + '/');
  });

  const domains = isIp ? ['', host] : ['', host, '.' + host, parentDomain, '.' + parentDomain];
  const names = ['googtrans', 'googtrans_saved', 'googtrans_prev', 'googtransopt'];

  try {
    localStorage.removeItem('googtrans');
    sessionStorage.removeItem('googtrans');
    localStorage.setItem('neobank_lang', 'en');
    sessionStorage.setItem('neobank_lang', 'en');
  } catch (e) {}

  names.forEach(name => {
    paths.forEach(p => {
      domains.forEach(d => {
        const pathPart = p ? `path=${p};` : 'path=/;';
        const domainPart = d ? `domain=${d};` : '';
        document.cookie = `${name}=; ${pathPart} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
        document.cookie = `${name}=none; ${pathPart} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
        document.cookie = `${name}=; ${pathPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
      });
    });
  });

  // Explicitly remove googtrans without setting /en/en
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/;';
  document.cookie = 'googtrans=none; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/;';
  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;';

  // Clean URL hash if it contains googtrans
  if (window.location.hash && window.location.hash.includes('googtrans')) {
    try {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    } catch (e) {}
  }
}

// Helper to set cookie for Google Translate
function setTranslateCookie(lang) {
  let gCode = lang;
  if (lang === 'zh') gCode = 'zh-CN';
  
  if (lang === 'en') {
    clearAllTranslateCookies();
  } else {
    const cookieVal = `/en/${gCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    const host = window.location.hostname;
    const isIp = /^(\d+\.){3}\d+$/.test(host);
    if (host && !isIp) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host};`;
    }
  }
}

// Get current active language code
function getCurrentLanguage() {
  const local = localStorage.getItem('neobank_lang');
  if (local === 'en') {
    return 'en';
  }
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z-]+)/);
  if (match && match[1] && match[1] !== 'en') {
    return match[1];
  }
  if (local && local !== 'en') {
    return local;
  }
  return 'en';
}

// Ensure translation canary element exists in the DOM for deterministic state tracking
function ensureCanaryElement() {
  let canary = document.getElementById(CANARY_ID);
  if (!canary) {
    canary = document.createElement('div');
    canary.id = CANARY_ID;
    canary.setAttribute('aria-hidden', 'true');
    canary.style.cssText = 'position:fixed;bottom:-9999px;right:-9999px;width:1px;height:1px;overflow:hidden;opacity:0.01;pointer-events:none;';
    canary.textContent = ORIGINAL_CANARY_TEXT;
    const mountPoint = document.body || document.documentElement;
    if (mountPoint) {
      mountPoint.appendChild(canary);
    }
  }
  return canary;
}

function getCanaryText() {
  const el = ensureCanaryElement();
  return el ? (el.textContent || '').trim() : '';
}

// Ensure smooth transition frosted-glass backdrop and pill UI
function getTransitionElements() {
  let backdrop = document.getElementById('neobank-lang-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'neobank-lang-backdrop';
    backdrop.className = 'lang-transition-backdrop';
    backdrop.innerHTML = `
      <div id="neobank-lang-pill" class="lang-transition-pill">
        <span class="lang-pulse-dot"></span>
        <span id="neobank-lang-pill-text">Translating...</span>
      </div>
    `;
    const mountPoint = document.body || document.documentElement;
    if (mountPoint) {
      mountPoint.appendChild(backdrop);
    }
  }
  const pill = document.getElementById('neobank-lang-pill');
  const pillText = document.getElementById('neobank-lang-pill-text');
  return { backdrop, pill, pillText };
}

// Show frosted glass veil and pill indicator
function showTransitionMask(targetLangCode) {
  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === targetLangCode || (l.code === 'zh-CN' && targetLangCode === 'zh'));
  const langLabel = langObj ? langObj.label : targetLangCode.toUpperCase();

  const { backdrop, pill, pillText } = getTransitionElements();
  if (pillText) {
    pillText.textContent = (targetLangCode === 'en') ? 'Restoring English...' : `Translating to ${langLabel}...`;
  }

  if (document.body) {
    document.body.classList.add('lang-transitioning');
  }
  if (backdrop) backdrop.classList.add('active');
  if (pill) pill.classList.add('active');
}

// Hide frosted glass veil
function hideTransitionMask() {
  const earlyStyle = document.getElementById('neobank-early-blur');
  if (earlyStyle) earlyStyle.remove();

  const backdrop = document.getElementById('neobank-lang-backdrop');
  const pill = document.getElementById('neobank-lang-pill');

  if (document.body) {
    document.body.classList.remove('lang-transitioning');
  }

  if (pill) pill.classList.remove('active');
  if (backdrop) {
    backdrop.classList.remove('active');
  }
}

// Deep restore function to invoke internal Google Translate restore routines
function restoreGoogleTranslate() {
  let restored = false;

  const inst = window.googleTranslator || 
    (window.google && window.google.translate && window.google.translate.TranslateElement && window.google.translate.TranslateElement.getInstance && window.google.translate.TranslateElement.getInstance());

  if (inst) {
    try {
      if (inst.o && typeof inst.o.ra === 'function') {
        inst.o.ra(''); // Silently resets combo without triggering change event
      }
    } catch (e) {}
    try {
      inst.l = '';
      inst.H = false;
    } catch (e) {}
    try {
      if (inst.G && inst.G.j && typeof inst.G.j.restore === 'function') {
        inst.G.j.restore();
        restored = true;
      }
    } catch (e) {}
    try {
      if (inst.G && typeof inst.G.restore === 'function') {
        inst.G.restore();
        restored = true;
      }
    } catch (e) {}
    try {
      if (typeof inst.restore === 'function') {
        inst.restore();
        restored = true;
      }
    } catch (e) {}
  }

  // 1. Google TranslateService instance restore
  try {
    if (window.google && window.google.translate && window.google.translate.TranslateService) {
      const ts = window.google.translate.TranslateService.getInstance();
      if (ts && typeof ts.restore === 'function') {
        ts.restore();
        restored = true;
      }
    }
  } catch (e) {}

  // 2. Saved global instance fallback
  try {
    if (window.googleTranslator) {
      Object.keys(window.googleTranslator).forEach(k => {
        const item = window.googleTranslator[k];
        if (item && typeof item.restore === 'function') {
          try { item.restore(); restored = true; } catch (e) {}
        }
      });
    }
  } catch (e) {}

  // 3. Trigger restore button in Google banner iframe
  try {
    document.querySelectorAll('iframe.goog-te-banner-frame, iframe[class*="VIpgJd"]').forEach(banner => {
      try {
        const doc = banner.contentDocument || banner.contentWindow.document;
        const btn = doc.querySelector('button[id*="restore"], .goog-te-button button, button');
        if (btn) {
          btn.click();
          restored = true;
        }
      } catch (e) {}
    });
  } catch (e) {}

  return restored;
}

// Reliable translation settlement checker
let activeVerifyTimer = null;
let activeVerifyObserver = null;

function waitForTranslationComplete(targetLang, oldCanaryText, onComplete) {
  if (activeVerifyTimer) clearInterval(activeVerifyTimer);
  if (activeVerifyObserver) {
    try { activeVerifyObserver.disconnect(); } catch (e) {}
  }

  const startTime = Date.now();
  const MAX_WAIT_MS = 2500; // Safe upper bound to never block users

  let isSettled = false;
  const finish = () => {
    if (isSettled) return;
    isSettled = true;
    if (activeVerifyTimer) clearInterval(activeVerifyTimer);
    if (activeVerifyObserver) {
      try { activeVerifyObserver.disconnect(); } catch (e) {}
    }
    setTimeout(() => {
      onComplete();
    }, 60);
  };

  const checkStatus = () => {
    const elapsed = Date.now() - startTime;
    if (elapsed >= MAX_WAIT_MS) {
      finish();
      return;
    }

    const currentCanary = getCanaryText();
    const fontCount = document.querySelectorAll('font').length;

    if (targetLang === 'en') {
      if (currentCanary === ORIGINAL_CANARY_TEXT && fontCount === 0) {
        finish();
      }
    } else {
      const isNotEnglish = (currentCanary !== ORIGINAL_CANARY_TEXT && currentCanary.length > 0);
      const isNotOldLang = !oldCanaryText || (currentCanary !== oldCanaryText);
      const hasTranslatedFonts = fontCount >= 2;

      if (isNotEnglish && isNotOldLang && hasTranslatedFonts) {
        finish();
      }
    }
  };

  activeVerifyTimer = setInterval(checkStatus, 35);

  try {
    activeVerifyObserver = new MutationObserver(() => {
      checkStatus();
    });
    if (document.body) {
      activeVerifyObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  } catch (e) {}

  checkStatus();
}

// Global initialization callback for Google Translate
window.googleTranslateElementInit = function() {
  const container = document.getElementById('google_translate_element');
  if (!container) {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.style.display = 'none';
    const mount = document.body || document.documentElement;
    if (mount) mount.appendChild(el);
  }

  if (window.google && window.google.translate) {
    window.googleTranslator = new window.google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,es,fr,de,hi,ar,zh-CN,ja,ru,pt,it,ko,tr,nl,bn,ta,te,mr,ur',
      autoDisplay: false
    }, 'google_translate_element');
  }
};

// Protect language select elements from ever being translated by Google Translate
function protectLanguageSelects() {
  document.querySelectorAll('.neobank-lang-select').forEach(select => {
    if (!select.classList.contains('notranslate')) select.classList.add('notranslate');
    select.classList.remove('skiptranslate');
    if (select.getAttribute('translate') !== 'no') select.setAttribute('translate', 'no');
    const parent = select.parentElement;
    if (parent) {
      if (!parent.classList.contains('neobank-lang-wrap')) parent.classList.add('neobank-lang-wrap');
      if (!parent.classList.contains('notranslate')) parent.classList.add('notranslate');
      parent.classList.remove('skiptranslate');
      if (parent.getAttribute('translate') !== 'no') parent.setAttribute('translate', 'no');
    }

    // Protect each option and restore original label if Google Translate altered it
    Array.from(select.options).forEach(opt => {
      if (!opt.classList.contains('notranslate')) opt.classList.add('notranslate');
      opt.classList.remove('skiptranslate');
      if (opt.getAttribute('translate') !== 'no') opt.setAttribute('translate', 'no');
      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === opt.value || (l.code === 'zh-CN' && opt.value === 'zh'));
      if (langObj) {
        const expected = langObj.label;
        if (opt.textContent.trim() !== expected || opt.children.length > 0) {
          opt.textContent = expected;
        }
      }
    });

    // Dedicated observer on the select to continuously revert any mutation caused by Google Translate
    if (!select._protectionObserver && typeof MutationObserver !== 'undefined') {
      select._protectionObserver = new MutationObserver(() => {
        Array.from(select.options).forEach(opt => {
          const langObj = SUPPORTED_LANGUAGES.find(l => l.code === opt.value || (l.code === 'zh-CN' && opt.value === 'zh'));
          if (langObj) {
            const expected = langObj.label;
            if (opt.textContent.trim() !== expected || opt.children.length > 0) {
              opt.textContent = expected;
            }
          }
        });
      });
      select._protectionObserver.observe(select, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  });
}

// Suppress Google Translate Top Banner Header, Toolbar, and Overlays Silently
function suppressGoogleBanner() {
  protectLanguageSelects();

  const styleEl = document.getElementById('anti-google-banner');
  if (styleEl && document.head && !document.head.contains(styleEl)) {
    document.head.appendChild(styleEl);
  }

  if (document.documentElement) {
    if (document.documentElement.style.top !== '0px') {
      document.documentElement.style.setProperty('top', '0px', 'important');
    }
    if (document.documentElement.style.position === 'relative') {
      document.documentElement.style.setProperty('position', 'static', 'important');
    }
    if (document.documentElement.style.marginTop !== '0px') {
      document.documentElement.style.setProperty('margin-top', '0px', 'important');
    }
  }

  if (document.body) {
    if (document.body.style.top && document.body.style.top !== '0px') {
      document.body.style.setProperty('top', '0px', 'important');
    }
    if (document.body.style.position === 'relative') {
      document.body.style.setProperty('position', 'static', 'important');
    }
    if (document.body.style.marginTop && document.body.style.marginTop !== '0px') {
      document.body.style.setProperty('margin-top', '0px', 'important');
    }
  }

  // Suppress all Google translate iframes completely
  document.querySelectorAll('iframe').forEach(frame => {
    frame.style.setProperty('display', 'none', 'important');
    frame.style.setProperty('visibility', 'hidden', 'important');
    frame.style.setProperty('height', '0px', 'important');
    frame.style.setProperty('width', '0px', 'important');
    frame.style.setProperty('max-height', '0px', 'important');
    frame.style.setProperty('max-width', '0px', 'important');
    frame.style.setProperty('position', 'fixed', 'important');
    frame.style.setProperty('top', '-99999px', 'important');
    frame.style.setProperty('left', '-99999px', 'important');
    frame.style.setProperty('opacity', '0', 'important');
    frame.style.setProperty('pointer-events', 'none', 'important');
    frame.style.setProperty('z-index', '-999999', 'important');
  });

  // Suppress Google toolbar banners and overlay classes (divs and iframes only - NEVER font tags!)
  document.querySelectorAll('iframe.goog-te-banner-frame, iframe[class*="VIpgJd"], .goog-te-banner-frame, .goog-te-balloon-frame, #goog-gt-tt, #goog-gt-vt, .goog-tooltip, div.VIpgJd-suEOdc, div.VIpgJd-yAWNEb-L7lbkb, div[class*="VIpgJd-ZVi9od"], div[class*="VIpgJd-suEOdc"]').forEach(el => {
    if (el.tagName === 'FONT' || (el.closest && el.closest('font')) ||
        el.classList.contains('neobank-lang-select') || 
        el.classList.contains('neobank-lang-wrap') || 
        (el.closest && el.closest('.neobank-lang-select, .neobank-lang-wrap')) || 
        (el.querySelector && el.querySelector('.neobank-lang-select'))) {
      return;
    }
    if (el.id === 'google_translate_element' || (el.closest && el.closest('#google_translate_element'))) {
      el.style.setProperty('display', 'none', 'important');
      return;
    }
    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('height', '0px', 'important');
    el.style.setProperty('width', '0px', 'important');
    el.style.setProperty('position', 'fixed', 'important');
    el.style.setProperty('top', '-99999px', 'important');
    el.style.setProperty('opacity', '0', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('z-index', '-999999', 'important');
  });

  // Ensure all translated fonts remain clean, visible, and inline
  document.querySelectorAll('font').forEach(font => {
    if (font.style.display === 'none' || font.style.visibility === 'hidden' || font.style.position === 'fixed') {
      font.style.removeProperty('display');
      font.style.removeProperty('visibility');
      font.style.removeProperty('opacity');
      font.style.removeProperty('position');
      font.style.removeProperty('top');
      font.style.removeProperty('left');
      font.style.removeProperty('height');
      font.style.removeProperty('width');
    }
    if (font.classList.contains('VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q')) {
      font.classList.remove('VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q');
    }
  });
}

// Handle user language selection change
function handleLanguageChange(target) {
  const lang = (typeof target === 'string') ? target : (target ? target.value : 'en');
  const prevLang = getCurrentLanguage();

  // If user selected English:
  if (lang === 'en') {
    showTransitionMask('en');
    try {
      localStorage.setItem('neobank_lang', 'en');
      sessionStorage.setItem('neobank_lang', 'en');
      localStorage.removeItem('googtrans');
      sessionStorage.removeItem('googtrans');
    } catch (e) {}
    clearAllTranslateCookies();
    document.documentElement.dir = 'ltr';

    document.querySelectorAll('.neobank-lang-select').forEach(sel => {
      sel.value = 'en';
    });
    updateLanguageFlagIcons('en');

    // 1. Deep Google Translate instance restore
    restoreGoogleTranslate();

    // 2. Silently reset combo WITHOUT triggering change event
    const gCombo = document.querySelector('.goog-te-combo');
    if (gCombo) {
      gCombo.value = '';
    }

    // 3. Check settlement after 180ms
    setTimeout(() => {
      clearAllTranslateCookies();
      const canaryText = getCanaryText();
      const fontCount = document.querySelectorAll('font').length;

      // If canary is restored to English and fonts are gone:
      if (canaryText === ORIGINAL_CANARY_TEXT && fontCount === 0) {
        protectLanguageSelects();
        setTimeout(hideTransitionMask, 100);
      } else {
        // Safe and clean reload: since cookies are wiped and neobank_lang='en', page boots in pure native English
        clearAllTranslateCookies();
        window.location.reload();
      }
    }, 180);

    return;
  }

  // Non-English language chosen:
  const oldCanaryText = getCanaryText();

  try {
    localStorage.setItem('neobank_lang', lang);
    sessionStorage.setItem('neobank_lang', lang);
  } catch (e) {}
  setTranslateCookie(lang);

  // Sync RTL / LTR direction for Arabic
  document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

  // Sync all dropdowns on page and update flag icon
  document.querySelectorAll('.neobank-lang-select').forEach(sel => {
    sel.value = lang;
  });
  updateLanguageFlagIcons(lang);

  // 1. Immediately activate frosted glass blur veil to completely conceal intermediate English transition
  showTransitionMask(lang);

  suppressGoogleBanner();

  let gCode = lang;
  if (lang === 'zh') gCode = 'zh-CN';

  const gCombo = document.querySelector('.goog-te-combo');
  if (gCombo) {
    gCombo.value = gCode;
    gCombo.dispatchEvent(new Event('change'));
    waitForTranslationComplete(lang, oldCanaryText, () => {
      protectLanguageSelects();
      hideTransitionMask();
    });
  } else {
    // If Google Translate is not yet loaded, wait and retry smoothly
    let retryAttempts = 0;
    const retryInterval = setInterval(() => {
      retryAttempts++;
      const retryCombo = document.querySelector('.goog-te-combo');
      if (retryCombo) {
        clearInterval(retryInterval);
        retryCombo.value = gCode;
        retryCombo.dispatchEvent(new Event('change'));
        waitForTranslationComplete(lang, oldCanaryText, () => {
          protectLanguageSelects();
          hideTransitionMask();
        });
      } else if (retryAttempts >= 15) {
        clearInterval(retryInterval);
        protectLanguageSelects();
        hideTransitionMask();
      }
    }, 100);
  }
}

// Attach to window object for global access
window.handleLanguageChange = handleLanguageChange;
// Export helpers globally
window.SUPPORTED_LANGUAGES = SUPPORTED_LANGUAGES;
window.getFlagSvgForLang = getFlagSvgForLang;
window.updateLanguageFlagIcons = updateLanguageFlagIcons;

// Auto-run flag icon update on script load / DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => updateLanguageFlagIcons());
} else {
  updateLanguageFlagIcons();
}
window.getCurrentLanguage = getCurrentLanguage;
window.clearAllTranslateCookies = clearAllTranslateCookies;
window.setTranslateCookie = setTranslateCookie;
window.protectLanguageSelects = protectLanguageSelects;
window.showTransitionMask = showTransitionMask;
window.hideTransitionMask = hideTransitionMask;
window.restoreGoogleTranslate = restoreGoogleTranslate;

// Dynamically inject Google Translate script and initialize UI
function initGoogleTranslator() {
  ensureCanaryElement();

  if (!document.getElementById('google_translate_element')) {
    const gDiv = document.createElement('div');
    gDiv.id = 'google_translate_element';
    gDiv.style.display = 'none';
    const mount = document.body || document.documentElement;
    if (mount) mount.appendChild(gDiv);
  }

  // Populate options for any .neobank-lang-select on page with strict notranslate markers
  const currentLang = getCurrentLanguage();
  document.querySelectorAll('.neobank-lang-select').forEach(select => {
    select.classList.add('notranslate');
    select.classList.remove('skiptranslate');
    select.setAttribute('translate', 'no');
    if (select.parentElement) {
      select.parentElement.classList.add('neobank-lang-wrap');
      select.parentElement.classList.add('notranslate');
      select.parentElement.classList.remove('skiptranslate');
      select.parentElement.setAttribute('translate', 'no');
    }

    // Only populate if options are missing or fewer than 17
    if (select.options.length < SUPPORTED_LANGUAGES.length) {
      select.innerHTML = SUPPORTED_LANGUAGES.map(item => `
        <option value="${item.code}" class="notranslate" translate="no" ${item.code === currentLang || (item.code === 'zh-CN' && currentLang === 'zh') ? 'selected' : ''}>
          ${item.label}
        </option>
      `).join('');
    } else {
      select.value = currentLang;
    }
  });

  updateLanguageFlagIcons(currentLang);

  protectLanguageSelects();

  // Inject Google Translate script if not present
  if (!document.getElementById('google-translate-script')) {
    const script = document.createElement('script');
    script.id = 'google-translate-script';
    script.type = 'text/javascript';
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
  }

  // Handle page refresh with non-English language active:
  // Shows frosted glass veil while Google Translate runs
  if (currentLang && currentLang !== 'en') {
    showTransitionMask(currentLang);
    waitForTranslationComplete(currentLang, null, () => {
      protectLanguageSelects();
      hideTransitionMask();
    });
  }
}

// Observe DOM modifications to continuously eradicate Google banner and protect select
if (typeof MutationObserver !== 'undefined') {
  let suppressDebounce = null;
  const bannerObserver = new MutationObserver((mutations) => {
    let hasGoogleNodes = false;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          // Never touch font elements or text content
          if (node.tagName === 'FONT' || (node.closest && node.closest('font'))) {
            continue;
          }
          if (node.classList.contains('neobank-lang-select') || 
              node.classList.contains('neobank-lang-wrap') || 
              (node.closest && node.closest('.neobank-lang-select, .neobank-lang-wrap')) || 
              (node.querySelector && node.querySelector('.neobank-lang-select'))) {
            continue;
          }
          const className = (typeof node.className === 'string') ? node.className : '';
          // Only target iframes or Google overlay container divs
          if (node.tagName === 'IFRAME' || (node.tagName === 'DIV' && (className.includes('VIpgJd') || className.includes('goog-te-banner') || className.includes('goog-te-balloon')))) {
            if (node.id === 'google_translate_element' || (node.closest && node.closest('#google_translate_element'))) {
              continue;
            }
            node.style.setProperty('display', 'none', 'important');
            node.style.setProperty('visibility', 'hidden', 'important');
            node.style.setProperty('height', '0px', 'important');
            node.style.setProperty('width', '0px', 'important');
            node.style.setProperty('position', 'fixed', 'important');
            node.style.setProperty('top', '-99999px', 'important');
            node.style.setProperty('opacity', '0', 'important');
            node.style.setProperty('pointer-events', 'none', 'important');
            hasGoogleNodes = true;
          }
        }
      }
    }
    if (hasGoogleNodes) {
      if (suppressDebounce) clearTimeout(suppressDebounce);
      suppressDebounce = setTimeout(suppressGoogleBanner, 80);
    }
  });

  bannerObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

// Global safeguard: Ensure clicking or focusing on any translated text or button NEVER removes the text
['click', 'mousedown', 'mouseover', 'focusin'].forEach(evt => {
  document.addEventListener(evt, (e) => {
    const font = e.target && (e.target.tagName === 'FONT' ? e.target : (e.target.closest && e.target.closest('font')));
    if (font) {
      if (font.classList.contains('VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q')) {
        font.classList.remove('VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q');
      }
      if (font.style.display === 'none' || font.style.visibility === 'hidden' || font.style.position === 'fixed') {
        font.style.removeProperty('display');
        font.style.removeProperty('visibility');
        font.style.removeProperty('opacity');
        font.style.removeProperty('position');
        font.style.removeProperty('top');
        font.style.removeProperty('left');
      }
    }
  }, true);
});

// Low-frequency periodic safety check (500ms)
setInterval(suppressGoogleBanner, 500);

// Auto-boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initGoogleTranslator();
    suppressGoogleBanner();
  });
} else {
  initGoogleTranslator();
  suppressGoogleBanner();
}
window.addEventListener('load', suppressGoogleBanner);
