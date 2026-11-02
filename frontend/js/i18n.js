/**
 * NeoBank Global Google Website Translator Engine
 * Self-mounting, universal multi-language translation for all application pages.
 * Supports all 50+ target languages sorted strictly A-Z with SVG country flags,
 * sticky search filter dropdown, frosted-glass loading transition veil,
 * full English first-load default, and bi-directional RTL support.
 */

(function(window, document) {
  'use strict';

  // 1. Comprehensive Vector SVG Flags lookup for all target locales
  const COUNTRY_FLAGS_SVG = {
    US: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/><path fill="#192f5d" d="M0 0h256v258.5H0z"/><g fill="#fff"><circle cx="28" cy="24" r="6"/><circle cx="70" cy="24" r="6"/><circle cx="112" cy="24" r="6"/><circle cx="154" cy="24" r="6"/><circle cx="196" cy="24" r="6"/><circle cx="238" cy="24" r="6"/><circle cx="49" cy="48" r="6"/><circle cx="91" cy="48" r="6"/><circle cx="133" cy="48" r="6"/><circle cx="175" cy="48" r="6"/><circle cx="217" cy="48" r="6"/><circle cx="28" cy="72" r="6"/><circle cx="70" cy="72" r="6"/><circle cx="112" cy="72" r="6"/><circle cx="154" cy="72" r="6"/><circle cx="196" cy="72" r="6"/><circle cx="238" cy="72" r="6"/></g></svg>',
    ZA: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#000" d="M0 0h640v480H0z"/><path fill="#fff" d="M0 0h640v160H0z"/><path fill="#e03c31" d="M0 0h640v133.3H0z"/><path fill="#001489" d="M0 346.7h640V480H0z"/><path fill="#fcb514" d="M0 0l240 240L0 480z"/><path fill="#000" d="M0 35l205 205L0 445z"/><path fill="#007749" d="M0 160h180l200 80-200 80H0v-40l140-40L0 200z"/><path fill="#007749" d="M240 200h400v80H240z"/></svg>',
    SA: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006c35" d="M0 0h640v480H0z"/><path fill="#fff" d="M160 270h320v15H160z"/><circle cx="320" cy="220" r="30" fill="none" stroke="#fff" stroke-width="6"/></svg>',
    AZ: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#00b5e2" d="M0 0h640v160H0z"/><path fill="#ed2939" d="M0 160h640v160H0z"/><path fill="#3f9c35" d="M0 320h640v160H0z"/><circle cx="300" cy="240" r="45" fill="#fff"/><circle cx="310" cy="240" r="38" fill="#ed2939"/><polygon fill="#fff" points="340,240 348,245 352,238 358,244 360,235 368,238 365,230 373,230 367,224 372,217 364,216 364,208 357,212 352,206 350,214 342,212 346,220 338,225 346,228"/></svg>',
    BG: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v160H0z"/><path fill="#00966e" d="M0 160h640v160H0z"/><path fill="#d62612" d="M0 320h640v160H0z"/></svg>',
    BD: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006a4e" d="M0 0h640v480H0z"/><circle cx="290" cy="240" r="110" fill="#f42a41"/></svg>',
    MM: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fecb00" d="M0 0h640v160H0z"/><path fill="#34b233" d="M0 160h640v160H0z"/><path fill="#ea2839" d="M0 320h640v160H0z"/><polygon fill="#fff" points="320,130 348,216 438,216 365,269 393,355 320,302 247,355 275,269 202,216 292,216"/></svg>',
    CN: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#de2910" d="M0 0h640v480H0z"/><polygon fill="#ffde00" points="100,50 115,95 160,95 125,120 140,165 100,135 60,165 75,120 40,95 85,95"/><circle cx="200" cy="60" r="10" fill="#ffde00"/><circle cx="240" cy="100" r="10" fill="#ffde00"/><circle cx="240" cy="150" r="10" fill="#ffde00"/><circle cx="200" cy="190" r="10" fill="#ffde00"/></svg>',
    HR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ff0000" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#171796" d="M0 320h640v160H0z"/><rect x="270" y="180" width="100" height="120" fill="#ff0000" stroke="#fff" stroke-width="4"/></svg>',
    CZ: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v240H0z"/><path fill="#d7141a" d="M0 240h640v240H0z"/><polygon fill="#11457e" points="0,0 320,240 0,480"/></svg>',
    DK: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#c60c30" d="M0 0h640v480H0z"/><path fill="#fff" d="M180 0h60v480h-60zM0 210h640v60H0z"/></svg>',
    NL: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ae1c28" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#21468b" d="M0 320h640v160H0z"/></svg>',
    FI: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#002f6c" d="M175 0h90v480h-90zM0 195h640v90H0z"/></svg>',
    FR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#002654" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/></svg>',
    DE: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#000" d="M0 0h640v160H0z"/><path fill="#dd0000" d="M0 160h640v160H0z"/><path fill="#ffce00" d="M0 320h640v160H0z"/></svg>',
    GR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#0d5eaf" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="53.3" d="M0 80h640M0 186.7h640M0 293.3h640M0 400h640"/><path fill="#0d5eaf" d="M0 0h266.7v266.7H0z"/><path stroke="#fff" stroke-width="53.3" d="M133.3 0v266.7M0 133.3h266.7"/></svg>',
    IN: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#f93" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#128807" d="M0 320h640v160H0z"/><circle cx="320" cy="240" r="44" fill="none" stroke="#008" stroke-width="7"/><circle cx="320" cy="240" r="10" fill="#008"/></svg>',
    IL: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#0038b8" d="M0 60h640v60H0zM0 360h640v60H0z"/><polygon points="320,180 370,270 270,270" fill="none" stroke="#0038b8" stroke-width="12"/><polygon points="320,300 370,210 270,210" fill="none" stroke="#0038b8" stroke-width="12"/></svg>',
    HU: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ce2939" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#477050" d="M0 320h640v160H0z"/></svg>',
    ID: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#e70011" d="M0 0h640v240H0z"/><path fill="#fff" d="M0 240h640v240H0z"/></svg>',
    IT: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#009246" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce2b37" d="M426.7 0H640v480H426.7z"/></svg>',
    JP: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><circle cx="320" cy="240" r="120" fill="#bc002d"/></svg>',
    KZ: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#00afca" d="M0 0h640v480H0z"/><circle cx="320" cy="240" r="60" fill="#fec50c"/></svg>',
    KR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><path fill="#cd2e3a" d="M320 140a100 100 0 0 1 0 200 50 50 0 0 1 0-100 50 50 0 0 0 0-100z"/><path fill="#0047a0" d="M320 240a50 50 0 0 1 0 100 100 100 0 0 1 0-200 50 50 0 0 0 0 100z"/></svg>',
    MY: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#cc0001" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="34.3" d="M0 51.4h640M0 120h640M0 188.6h640M0 257.1h640M0 325.7h640M0 394.3h640"/><path fill="#010066" d="M0 0h320v274.3H0z"/><circle cx="160" cy="137" r="70" fill="#ffcc00"/></svg>',
    NP: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#003893" d="M0 0h400v480H0z"/><polygon fill="#dc143c" points="30,30 330,220 150,220 330,450 30,450"/><circle cx="120" cy="150" r="35" fill="#fff"/><circle cx="120" cy="350" r="40" fill="#fff"/></svg>',
    NO: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ba0c2f" d="M0 0h640v480H0z"/><path fill="#fff" d="M160 0h120v480h-120zM0 180h640v120H0z"/><path fill="#00205b" d="M190 0h60v480h-60zM0 210h640v60H0z"/></svg>',
    IR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#239f40" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#da0000" d="M0 320h640v160H0z"/><circle cx="320" cy="240" r="45" fill="#da0000"/></svg>',
    PL: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v240H0z"/><path fill="#dc143c" d="M0 240h640v240H0z"/></svg>',
    PT: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006600" d="M0 0h256v480H0z"/><path fill="#ff0000" d="M256 0h384v480H256z"/><circle cx="256" cy="240" r="50" fill="#ffff00"/></svg>',
    RO: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#002b7f" d="M0 0h213.3v480H0z"/><path fill="#fcd116" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/></svg>',
    RU: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v160H0z"/><path fill="#0039a6" d="M0 160h640v160H0z"/><path fill="#d52b1e" d="M0 320h640v160H0z"/></svg>',
    RS: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#c6363c" d="M0 0h640v160H0z"/><path fill="#0c4076" d="M0 160h640v160H0z"/><path fill="#fff" d="M0 320h640v160H0z"/></svg>',
    LK: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ffbe29" d="M0 0h640v480H0z"/><path fill="#005f56" d="M60 40h70v400H60z"/><path fill="#eb7400" d="M150 40h70v400h-70z"/><path fill="#8d153a" d="M240 40h340v400H240z"/><circle cx="410" cy="240" r="60" fill="#ffbe29"/></svg>',
    SK: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v160H0z"/><path fill="#0b4ea2" d="M0 160h640v160H0z"/><path fill="#ee1c25" d="M0 320h640v160H0z"/><circle cx="210" cy="240" r="50" fill="#fff" stroke="#ee1c25" stroke-width="8"/></svg>',
    ES: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#c60b1e" d="M0 0h640v480H0z"/><path fill="#ffc400" d="M0 120h640v240H0z"/><circle cx="160" cy="240" r="32" fill="#c60b1e"/></svg>',
    KE: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#000" d="M0 0h640v133.3H0z"/><path fill="#fff" d="M0 133.3h640v26.7H0z"/><path fill="#bb0000" d="M0 160h640v160H0z"/><path fill="#fff" d="M0 320h640v26.7H0z"/><path fill="#006600" d="M0 346.7h640V480H0z"/><ellipse cx="320" cy="240" rx="50" ry="100" fill="#bb0000" stroke="#fff" stroke-width="10"/></svg>',
    SE: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006aa7" d="M0 0h640v480H0z"/><path fill="#fecc00" d="M180 0h80v480h-80zM0 200h640v80H0z"/></svg>',
    PH: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#0038a8" d="M0 0h640v240H0z"/><path fill="#ce1126" d="M0 240h640v240H0z"/><polygon fill="#fff" points="0,0 280,240 0,480"/><circle cx="100" cy="240" r="32" fill="#fcd116"/></svg>',
    TH: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#a51931" d="M0 0h640v80H0zM0 400h640v80H0z"/><path fill="#f4f5f8" d="M0 80h640v80H0zM0 320h640v80H0z"/><path fill="#2d2a4a" d="M0 160h640v160H0z"/></svg>',
    TR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#e30a17" d="M0 0h640v480H0z"/><circle cx="280" cy="240" r="90" fill="#fff"/><circle cx="305" cy="240" r="72" fill="#e30a17"/><polygon fill="#fff" points="380,240 410,250 395,225 410,205 385,215 365,195 370,225 350,240 375,245 375,270"/></svg>',
    UA: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#005bbb" d="M0 0h640v240H0z"/><path fill="#ffd500" d="M0 240h640v240H0z"/></svg>',
    PK: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#01411c" d="M0 0h640v480H0z"/><path fill="#fff" d="M0 0h160v480H0z"/><circle cx="400" cy="240" r="90" fill="#fff"/><circle cx="425" cy="225" r="85" fill="#01411c"/><polygon fill="#fff" points="435,200 445,215 460,205 450,225 465,235 445,235 440,255 430,238 410,245 425,230 415,215 430,220"/></svg>',
    UZ: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#0099b5" d="M0 0h640v150H0z"/><path fill="#ce1126" d="M0 150h640v15H0z"/><path fill="#fff" d="M0 165h640v150H0z"/><path fill="#ce1126" d="M0 315h640v15H0z"/><path fill="#1eb53a" d="M0 330h640v150H0z"/><circle cx="80" cy="75" r="30" fill="#fff"/><circle cx="90" cy="75" r="25" fill="#0099b5"/></svg>',
    VN: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#da251d" d="M0 0h640v480H0z"/><polygon fill="#ff0" points="320,110 358,228 482,228 382,300 420,418 320,345 220,418 258,300 158,228 282,228"/></svg>'
  };

  // 2. Strict Alphabetical Order (A-Z by English display name) for all 52 supported target languages
  const LANGUAGES = [
    { code: 'af', name: 'Afrikaans (ZA)', flag: 'ZA' },
    { code: 'ar', name: 'Arabic (SA/AE)', flag: 'SA', dir: 'rtl' },
    { code: 'az', name: 'Azerbaijani (AZ)', flag: 'AZ' },
    { code: 'bn', name: 'Bengali (BD/IN)', flag: 'BD' },
    { code: 'bg', name: 'Bulgarian (BG)', flag: 'BG' },
    { code: 'my', name: 'Burmese (MM)', flag: 'MM' },
    { code: 'zh-CN', name: 'Chinese Mandarin (CN)', flag: 'CN' },
    { code: 'hr', name: 'Croatian (HR)', flag: 'HR' },
    { code: 'cs', name: 'Czech (CZ)', flag: 'CZ' },
    { code: 'da', name: 'Danish (DK)', flag: 'DK' },
    { code: 'nl', name: 'Dutch (NL)', flag: 'NL' },
    { code: 'en', name: 'English (US/UK)', flag: 'US' },
    { code: 'fi', name: 'Finnish (FI)', flag: 'FI' },
    { code: 'fr', name: 'French (FR)', flag: 'FR' },
    { code: 'de', name: 'German (DE)', flag: 'DE' },
    { code: 'el', name: 'Greek (GR)', flag: 'GR' },
    { code: 'gu', name: 'Gujarati (IN)', flag: 'IN' },
    { code: 'he', name: 'Hebrew (IL)', flag: 'IL', dir: 'rtl' },
    { code: 'hi', name: 'Hindi (IN)', flag: 'IN' },
    { code: 'hu', name: 'Hungarian (HU)', flag: 'HU' },
    { code: 'id', name: 'Indonesian (ID)', flag: 'ID' },
    { code: 'it', name: 'Italian (IT)', flag: 'IT' },
    { code: 'ja', name: 'Japanese (JP)', flag: 'JP' },
    { code: 'kn', name: 'Kannada (IN)', flag: 'IN' },
    { code: 'kk', name: 'Kazakh (KZ)', flag: 'KZ' },
    { code: 'ko', name: 'Korean (KR)', flag: 'KR' },
    { code: 'ms', name: 'Malay (MY)', flag: 'MY' },
    { code: 'ml', name: 'Malayalam (IN)', flag: 'IN' },
    { code: 'mr', name: 'Marathi (IN)', flag: 'IN' },
    { code: 'ne', name: 'Nepali (NP)', flag: 'NP' },
    { code: 'no', name: 'Norwegian (NO)', flag: 'NO' },
    { code: 'fa', name: 'Persian (IR)', flag: 'IR', dir: 'rtl' },
    { code: 'pl', name: 'Polish (PL)', flag: 'PL' },
    { code: 'pt', name: 'Portuguese (PT/BR)', flag: 'PT' },
    { code: 'pa', name: 'Punjabi (IN)', flag: 'IN' },
    { code: 'ro', name: 'Romanian (RO)', flag: 'RO' },
    { code: 'ru', name: 'Russian (RU)', flag: 'RU' },
    { code: 'sr', name: 'Serbian (RS)', flag: 'RS' },
    { code: 'si', name: 'Sinhala (LK)', flag: 'LK' },
    { code: 'sk', name: 'Slovak (SK)', flag: 'SK' },
    { code: 'es', name: 'Spanish (ES)', flag: 'ES' },
    { code: 'sw', name: 'Swahili (KE/TZ)', flag: 'KE' },
    { code: 'sv', name: 'Swedish (SE)', flag: 'SE' },
    { code: 'tl', name: 'Tagalog (PH)', flag: 'PH' },
    { code: 'ta', name: 'Tamil (IN)', flag: 'IN' },
    { code: 'te', name: 'Telugu (IN)', flag: 'IN' },
    { code: 'th', name: 'Thai (TH)', flag: 'TH' },
    { code: 'tr', name: 'Turkish (TR)', flag: 'TR' },
    { code: 'uk', name: 'Ukrainian (UA)', flag: 'UA' },
    { code: 'ur', name: 'Urdu (PK)', flag: 'PK', dir: 'rtl' },
    { code: 'uz', name: 'Uzbek (UZ)', flag: 'UZ' },
    { code: 'vi', name: 'Vietnamese (VN)', flag: 'VN' }
  ];

  function getFlagSvgByCode(flagKey) {
    return COUNTRY_FLAGS_SVG[flagKey] || COUNTRY_FLAGS_SVG.US;
  }

  function getFlagSvg(langCode) {
    const clean = (langCode || 'en').toLowerCase();
    const item = LANGUAGES.find(l => l.code.toLowerCase() === clean || 
      (clean === 'zh' && l.code.startsWith('zh')) ||
      (clean === 'iw' && l.code === 'he'));
    if (item && item.flag && COUNTRY_FLAGS_SVG[item.flag]) {
      return COUNTRY_FLAGS_SVG[item.flag];
    }
    return COUNTRY_FLAGS_SVG.US;
  }

  // 3. Pre-activation of frosted blur immediately on document evaluation if non-English
  (function preActivateBlur() {
    try {
      const stored = localStorage.getItem('neobank_lang');
      let lang = stored;
      if (!lang) {
        const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z-]+)/);
        lang = match && match[1];
      }
      if (lang && lang !== 'en') {
        const style = document.createElement('style');
        style.id = 'neobank-early-blur';
        style.textContent = `
          main, #screen-auth, .dashboard-container, #wizard-section, .bank-paper-sheet {
            filter: blur(12px) saturate(1.15) !important;
            opacity: 0.65 !important;
          }
        `;
        (document.head || document.documentElement).appendChild(style);
      }
    } catch (e) {}
  })();

  // 4. Frosted Glass Transition Elements
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

  function showTransitionMask(targetLangCode) {
    const langObj = LANGUAGES.find(l => l.code === targetLangCode || (l.code === 'zh-CN' && targetLangCode === 'zh'));
    const langLabel = langObj ? langObj.name : (targetLangCode ? targetLangCode.toUpperCase() : 'English');

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

  function hideTransitionMask() {
    const earlyStyle = document.getElementById('neobank-early-blur');
    if (earlyStyle) earlyStyle.remove();

    const backdrop = document.getElementById('neobank-lang-backdrop');
    const pill = document.getElementById('neobank-lang-pill');

    if (document.body) {
      document.body.classList.remove('lang-transitioning');
    }
    if (pill) pill.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  }

  function waitForTranslationComplete(targetLang, callback) {
    if (targetLang === 'en') {
      setTimeout(() => {
        if (typeof callback === 'function') callback();
      }, 80);
      return;
    }

    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      if (observer) observer.disconnect();
      if (typeof callback === 'function') callback();
    };

    const fallbackTimer = setTimeout(finish, 1300);

    let observer = null;
    if (typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.addedNodes) {
            for (const node of m.addedNodes) {
              if (node.nodeName === 'FONT' || (node.querySelector && node.querySelector('font'))) {
                clearTimeout(fallbackTimer);
                setTimeout(finish, 100);
                return;
              }
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // 5. Default Application Language strictly to English (EN) on first visit
  function getActiveLanguage() {
    try {
      const stored = localStorage.getItem('neobank_lang');
      if (stored) return stored;
    } catch (e) {}

    // If no explicit user selection was stored, default strictly to English (EN)
    return 'en';
  }

  function purgeAllGoogtransCookies() {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || /^(\d+\.){3}\d+$/.test(host);
    const hostParts = host.split('.');
    const parentDomain = hostParts.length > 2 ? hostParts.slice(-2).join('.') : host;

    const paths = ['/', window.location.pathname, ''];
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    let acc = '';
    pathSegments.forEach(s => {
      acc += '/' + s;
      paths.push(acc);
      paths.push(acc + '/');
    });

    const domains = isLocal ? [''] : ['', host, '.' + host, parentDomain, '.' + parentDomain];
    const names = ['googtrans', 'googtrans_saved', 'googtrans_prev', 'googtransopt'];

    names.forEach(name => {
      paths.forEach(p => {
        domains.forEach(d => {
          const pathPart = p ? `path=${p};` : 'path=/;';
          const domainPart = d ? `domain=${d};` : '';
          document.cookie = `${name}=; ${pathPart} ${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
          document.cookie = `${name}=; ${pathPart} expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0;`;
        });
      });
    });

    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/;';
  }

  function setLanguageCookies(lang) {
    const clean = (lang === 'zh') ? 'zh-CN' : (lang || 'en');
    try {
      localStorage.setItem('neobank_lang', clean);
      sessionStorage.setItem('neobank_lang', clean);
    } catch (e) {}

    purgeAllGoogtransCookies();

    if (clean === 'en') {
      return;
    }

    const host = window.location.hostname;
    const isLocal = host === 'localhost' || /^(\d+\.){3}\d+$/.test(host);
    const cookieVal = `/en/${clean}`;

    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (!isLocal) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${host};`;
      const parts = host.split('.');
      if (parts.length > 2) {
        document.cookie = `googtrans=${cookieVal}; path=/; domain=.${parts.slice(-2).join('.')};`;
      }
    }
  }

  function syncRtlDirection(lang) {
    if (['ar', 'fa', 'ur', 'he'].includes(lang)) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }

  function restoreGoogleTranslate() {
    let restored = false;
    try {
      if (window.google && window.google.translate && window.google.translate.TranslateService) {
        const ts = window.google.translate.TranslateService.getInstance();
        if (ts && typeof ts.restore === 'function') {
          ts.restore();
          restored = true;
        }
      }
    } catch (e) {}

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

  // 6. Custom Searchable Dropdown with Sticky Search & SVG Country Flags in Every List Item
  function renderLanguageDropdown(container, currentLang) {
    if (!container) return;

    const activeItem = LANGUAGES.find(l => l.code === currentLang || (l.code === 'zh-CN' && currentLang === 'zh')) || LANGUAGES.find(l => l.code === 'en');
    const flagSvg = getFlagSvg(currentLang);
    const displayName = activeItem ? activeItem.name : 'English (US/UK)';

    // Build the list items HTML containing country flags for each option
    const itemsHtml = LANGUAGES.map(l => {
      const isSelected = (l.code === currentLang || (l.code === 'zh-CN' && currentLang === 'zh'));
      const itemFlagSvg = getFlagSvgByCode(l.flag);
      return `
        <div class="neobank-lang-item ${isSelected ? 'active' : ''}" 
             data-code="${l.code}" 
             data-name="${l.name.toLowerCase()}" 
             data-flag="${(l.flag || '').toLowerCase()}"
             role="option" 
             tabindex="0"
             aria-selected="${isSelected ? 'true' : 'false'}">
          <span class="neobank-lang-item-flag" aria-hidden="true">${itemFlagSvg}</span>
          <span class="neobank-lang-item-name">${l.name}</span>
          <span class="neobank-lang-item-code">${l.code.toUpperCase()}</span>
          ${isSelected ? '<span class="neobank-lang-item-check" aria-hidden="true">✓</span>' : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="neobank-lang-custom-dropdown notranslate" translate="no" id="neobank-lang-dropdown">
        <button type="button" class="neobank-lang-trigger" id="neobank-lang-trigger-btn" aria-haspopup="listbox" aria-expanded="false" title="Select UI Language (50+ Target Languages)">
          <span class="neobank-lang-trigger-flag" id="neobank-lang-trigger-flag">${flagSvg}</span>
          <span class="neobank-lang-trigger-name" id="neobank-lang-trigger-name">${displayName}</span>
          <svg class="neobank-lang-trigger-arrow" viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <div class="neobank-lang-menu" id="neobank-lang-menu" role="listbox" style="display: none;">
          <div class="neobank-lang-search-box">
            <div class="neobank-lang-search-wrapper">
              <input type="text" class="neobank-lang-search-input" id="neobank-lang-search-input" placeholder="Search language..." autocomplete="off" spellcheck="false">
              <button type="button" class="neobank-lang-search-clear" id="neobank-lang-search-clear" style="display:none;" title="Clear search" aria-label="Clear search">✕</button>
            </div>
          </div>
          
          <div class="neobank-lang-items-container custom-scrollbar" id="neobank-lang-items-list">
            ${itemsHtml}
          </div>
        </div>
      </div>
    `;

    setupLanguageDropdownController(container);
  }

  function setupLanguageDropdownController(container) {
    const trigger = container.querySelector('#neobank-lang-trigger-btn');
    const menu = container.querySelector('#neobank-lang-menu');
    const searchInput = container.querySelector('#neobank-lang-search-input');
    const clearBtn = container.querySelector('#neobank-lang-search-clear');
    const itemsList = container.querySelector('#neobank-lang-items-list');
    const dropdownWrap = container.querySelector('#neobank-lang-dropdown');

    if (!trigger || !menu || !searchInput || !itemsList) return;

    function openMenu() {
      menu.style.display = 'block';
      trigger.setAttribute('aria-expanded', 'true');
      if (dropdownWrap) dropdownWrap.classList.add('open');
      searchInput.value = '';
      if (clearBtn) clearBtn.style.display = 'none';
      filterItems('');
      setTimeout(() => searchInput.focus(), 50);

      // Scroll active item into view
      const activeEl = itemsList.querySelector('.neobank-lang-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    function closeMenu() {
      menu.style.display = 'none';
      trigger.setAttribute('aria-expanded', 'false');
      if (dropdownWrap) dropdownWrap.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.style.display !== 'none';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Prevent clicks inside the menu / search input from closing the menu
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    menu.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    searchInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') {
        if (searchInput.value) {
          searchInput.value = '';
          if (clearBtn) clearBtn.style.display = 'none';
          filterItems('');
        } else {
          closeMenu();
          trigger.focus();
        }
      }
    });

    // Real-time search filtering across all 52 languages
    function filterItems(query) {
      const q = (query || '').trim().toLowerCase();
      const items = itemsList.querySelectorAll('.neobank-lang-item');
      let visibleCount = 0;

      items.forEach(item => {
        const name = (item.getAttribute('data-name') || '').toLowerCase();
        const code = (item.getAttribute('data-code') || '').toLowerCase();
        const flag = (item.getAttribute('data-flag') || '').toLowerCase();
        const labelEl = item.querySelector('.neobank-lang-item-name');
        const labelText = (labelEl ? labelEl.textContent : '').toLowerCase();
        const matches = !q || name.includes(q) || code.includes(q) || flag.includes(q) || labelText.includes(q);
        if (matches) {
          item.classList.remove('hidden');
          item.style.setProperty('display', 'flex', 'important');
          visibleCount++;
        } else {
          item.classList.add('hidden');
          item.style.setProperty('display', 'none', 'important');
        }
      });

      let noMatchEl = itemsList.querySelector('.neobank-lang-no-match');
      if (visibleCount === 0) {
        if (!noMatchEl) {
          noMatchEl = document.createElement('div');
          noMatchEl.className = 'neobank-lang-no-match';
          itemsList.appendChild(noMatchEl);
        }
        noMatchEl.textContent = `No languages matching "${query}"`;
        noMatchEl.style.display = 'block';
      } else if (noMatchEl) {
        noMatchEl.style.display = 'none';
      }
    }

    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) {
        clearBtn.style.display = (val && val.trim().length > 0) ? 'inline-flex' : 'none';
      }
      filterItems(val);
    });

    if (clearBtn) {
      clearBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        searchInput.value = '';
        clearBtn.style.display = 'none';
        filterItems('');
        searchInput.focus();
      });
    }

    // Item selection
    itemsList.addEventListener('click', (e) => {
      const item = e.target.closest('.neobank-lang-item');
      if (!item) return;
      const code = item.getAttribute('data-code');
      if (code) {
        closeMenu();
        handleUserLanguageChange(code, true);
      }
    });

    // Keyboard navigation within the dropdown
    dropdownWrap.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenu();
        trigger.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (menu.style.display === 'none') {
          openMenu();
        } else {
          const visible = Array.from(itemsList.querySelectorAll('.neobank-lang-item')).filter(el => el.style.display !== 'none');
          const focused = document.activeElement;
          const idx = visible.indexOf(focused);
          if (idx >= 0 && idx < visible.length - 1) {
            visible[idx + 1].focus();
          } else if (visible.length > 0) {
            visible[0].focus();
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const visible = Array.from(itemsList.querySelectorAll('.neobank-lang-item')).filter(el => el.style.display !== 'none');
        const focused = document.activeElement;
        const idx = visible.indexOf(focused);
        if (idx > 0) {
          visible[idx - 1].focus();
        } else {
          searchInput.focus();
        }
      } else if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('neobank-lang-item')) {
        e.preventDefault();
        const code = document.activeElement.getAttribute('data-code');
        if (code) {
          closeMenu();
          handleUserLanguageChange(code, true);
        }
      }
    });

    // Close when clicking anywhere outside
    document.addEventListener('click', (e) => {
      if (!dropdownWrap.contains(e.target)) {
        closeMenu();
      }
    });
  }

  function mountLanguageSelector() {
    const currentLang = getActiveLanguage();
    syncRtlDirection(currentLang);
    if (window.NeobankTheme && typeof window.NeobankTheme.setCulture === 'function') {
      window.NeobankTheme.setCulture(currentLang);
    }

    if (currentLang === 'en') {
      purgeAllGoogtransCookies();
    } else {
      const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([a-zA-Z-]+)/);
      if (!match || match[1] !== currentLang) {
        setLanguageCookies(currentLang);
      }
    }

    // Mount custom dropdown strictly into dedicated #neobank-lang-container
    let mount = document.getElementById('neobank-lang-container');
    const gEl = document.getElementById('google_translate_element');
    if (!mount) {
      mount = document.createElement('div');
      mount.id = 'neobank-lang-container';
      mount.className = 'notranslate';
      mount.setAttribute('translate', 'no');
      
      if (gEl && gEl.parentElement) {
        gEl.parentElement.insertBefore(mount, gEl);
      } else {
        const headerControls = document.querySelector('.header-controls') || 
                               document.querySelector('.page-zoom-controls')?.parentElement ||
                               document.querySelector('header');
        if (headerControls) {
          const zoom = headerControls.querySelector('.page-zoom-controls');
          if (zoom && zoom.nextSibling) {
            headerControls.insertBefore(mount, zoom.nextSibling);
          } else {
            headerControls.appendChild(mount);
          }
        }
      }
    }

    if (mount) {
      renderLanguageDropdown(mount, currentLang);
    }

    if (!document.getElementById('google_translate_native_holder')) {
      const holder = document.createElement('div');
      holder.id = 'google_translate_native_holder';
      holder.setAttribute('aria-hidden', 'true');
      holder.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;';
      (document.body || document.documentElement).appendChild(holder);
    }

    if (currentLang && currentLang !== 'en') {
      showTransitionMask(currentLang);
      waitForTranslationComplete(currentLang, hideTransitionMask);
    }
  }

  // 7. Google Translate Element Init Callback
  window.googleTranslateElementInit = function() {
    try {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          autoDisplay: false
        }, 'google_translate_element');
      }
    } catch (e) {
      console.warn('Google Translate initialization note:', e);
    }
  };

  function loadGoogleTranslateScript() {
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      (document.head || document.documentElement).appendChild(script);
    }
  }

  // 8. Handling Language Changes with Instant UI Translation
  function handleUserLanguageChange(targetLang, isUserInitiated) {
    const isUser = (isUserInitiated !== false);
    const cleanLang = (targetLang === 'zh') ? 'zh-CN' : (targetLang || 'en');
    const currentLang = getActiveLanguage();

    const activeItem = LANGUAGES.find(l => l.code === cleanLang) || LANGUAGES.find(l => l.code === 'en');
    const flagSvg = getFlagSvg(cleanLang);

    // Update trigger UI immediately
    document.querySelectorAll('.neobank-lang-trigger-flag').forEach(el => el.innerHTML = flagSvg);
    document.querySelectorAll('.neobank-lang-trigger-name').forEach(el => el.textContent = activeItem.name);
    document.querySelectorAll('.neobank-lang-item').forEach(el => {
      const code = el.getAttribute('data-code');
      const isSelected = (code === cleanLang);
      el.classList.toggle('active', isSelected);
      el.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      const check = el.querySelector('.neobank-lang-item-check');
      if (isSelected && !check) {
        const cSpan = document.createElement('span');
        cSpan.className = 'neobank-lang-item-check';
        cSpan.textContent = '✓';
        el.appendChild(cSpan);
      } else if (!isSelected && check) {
        check.remove();
      }
    });

    document.querySelectorAll('.neobank-lang-select').forEach(sel => sel.value = cleanLang);

    // RESTORING ENGLISH:
    if (cleanLang === 'en') {
      if (!isUser && currentLang === 'en') {
        return;
      }

      try {
        localStorage.setItem('neobank_lang', 'en');
        sessionStorage.setItem('neobank_lang', 'en');
      } catch (e) {}

      if (window.NeobankTheme && typeof window.NeobankTheme.setCulture === 'function') {
        window.NeobankTheme.setCulture('en');
      }

      showTransitionMask('en');
      purgeAllGoogtransCookies();
      syncRtlDirection('en');

      restoreGoogleTranslate();

      const gCombo = document.querySelector('.goog-te-combo');
      if (gCombo) {
        gCombo.value = '';
      }

      if (typeof window.saveCustomerFormDraft === 'function') {
        try { window.saveCustomerFormDraft(false); } catch (e) {}
      }

      setTimeout(() => {
        purgeAllGoogtransCookies();
        window.location.reload();
      }, 150);
      return;
    }

    // NON-ENGLISH LANGUAGE SELECTED:
    if (!isUser && cleanLang === currentLang) {
      return;
    }

    setLanguageCookies(cleanLang);
    syncRtlDirection(cleanLang);
    if (window.NeobankTheme && typeof window.NeobankTheme.setCulture === 'function') {
      window.NeobankTheme.setCulture(cleanLang);
    }

    if (isUser || cleanLang !== currentLang) {
      showTransitionMask(cleanLang);
    }

    if (typeof window.saveCustomerFormDraft === 'function') {
      try { window.saveCustomerFormDraft(false); } catch (e) {}
    }

    // Dispatch immediately to Google Translate combo in-place
    const gCombo = document.querySelector('.goog-te-combo');
    if (gCombo) {
      gCombo.value = cleanLang;
      gCombo.dispatchEvent(new Event('change'));
      waitForTranslationComplete(cleanLang, hideTransitionMask);
    } else {
      let attempts = 0;
      const comboPoll = setInterval(() => {
        attempts++;
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
          clearInterval(comboPoll);
          combo.value = cleanLang;
          combo.dispatchEvent(new Event('change'));
          waitForTranslationComplete(cleanLang, hideTransitionMask);
        } else if (attempts >= 15) {
          clearInterval(comboPoll);
          hideTransitionMask();
        }
      }, 100);
    }
  }

  window.handleLanguageChange = handleUserLanguageChange;
  window.getCurrentLanguage = getActiveLanguage;
  window.showTransitionMask = showTransitionMask;
  window.hideTransitionMask = hideTransitionMask;
  window.restoreGoogleTranslate = restoreGoogleTranslate;
  window.purgeAllGoogtransCookies = purgeAllGoogtransCookies;
  window.LANGUAGES = LANGUAGES;
  window.COUNTRY_FLAGS_SVG = COUNTRY_FLAGS_SVG;
  window.getFlagSvg = getFlagSvg;

  // 9. Navigation and Back/Forward (bfcache) Synchronization
  function syncAllUi() {
    const cur = getActiveLanguage();
    syncRtlDirection(cur);
    const activeItem = LANGUAGES.find(l => l.code === cur || (l.code === 'zh-CN' && cur === 'zh')) || LANGUAGES.find(l => l.code === 'en');
    const flagSvg = getFlagSvg(cur);

    document.querySelectorAll('.neobank-lang-trigger-flag').forEach(el => el.innerHTML = flagSvg);
    document.querySelectorAll('.neobank-lang-trigger-name').forEach(el => el.textContent = activeItem.name);
    document.querySelectorAll('.neobank-lang-select').forEach(sel => {
      if (sel.value !== cur) sel.value = cur;
    });

    const gCombo = document.querySelector('.goog-te-combo');
    if (gCombo && cur !== 'en' && gCombo.value !== cur) {
      showTransitionMask(cur);
      gCombo.value = cur;
      gCombo.dispatchEvent(new Event('change'));
      waitForTranslationComplete(cur, hideTransitionMask);
    }
  }

  window.addEventListener('pageshow', function() {
    syncAllUi();
  });

  window.addEventListener('popstate', function() {
    syncAllUi();
  });

  // 10. Suppress Google Banner Shifts
  function suppressGoogleBanner() {
    const banner = document.querySelector('.goog-te-banner-frame');
    if (banner) banner.style.display = 'none';
    if (document.body && document.body.style.top !== '0px') {
      document.body.style.top = '0px';
    }
  }
  setInterval(suppressGoogleBanner, 300);

  // 11. Auto-Mount on Script Load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountLanguageSelector();
      loadGoogleTranslateScript();
    });
  } else {
    mountLanguageSelector();
    loadGoogleTranslateScript();
  }

})(window, document);
