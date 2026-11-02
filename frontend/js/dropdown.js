/**
 * NeoBank Core Banking Platform - Dropdown & Option Controller Module
 * Handles:
 * 1. Country flag dropdowns that start strictly closed (aria-expanded="false", display:none)
 *    and open as an absolute overlay that never pushes layout down.
 * 2. Inline custom email domain editor with ✓ / ✕ buttons, Enter/Esc keys, and validation (no popups).
 * 3. Prefix & "Other" conditional toggles.
 */
(function(window) {
  'use strict';

  // Country Phone Data with SVG flag lookup
  const COUNTRY_PHONE_LIST = [
    { code: '+91', country: 'IN', name: 'India', digits: 10 },
    { code: '+1', country: 'US', name: 'USA', digits: 10 },
    { code: '+44', country: 'GB', name: 'UK', digits: 10 },
    { code: '+971', country: 'AE', name: 'UAE', digits: 9 },
    { code: '+65', country: 'SG', name: 'Singapore', digits: 8 },
    { code: '+61', country: 'AU', name: 'Australia', digits: 9 },
    { code: '+1-CA', country: 'CA', name: 'Canada', digits: 10, displayCode: '+1' },
    { code: '+49', country: 'DE', name: 'Germany', digits: 11 },
    { code: '+33', country: 'FR', name: 'France', digits: 9 },
    { code: '+81', country: 'JP', name: 'Japan', digits: 10 },
    { code: '+966', country: 'SA', name: 'Saudi Arabia', digits: 9 }
  ];

  let activeOpenDropdown = null;
  window.previousEmailDomain = window.previousEmailDomain || '@gmail.com';

  const PHONE_FLAGS_MAP = {
    IN: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#f93" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#128807" d="M0 320h640v160H0z"/><circle cx="320" cy="240" r="44" fill="none" stroke="#008" stroke-width="7"/><circle cx="320" cy="240" r="10" fill="#008"/></svg>',
    US: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#bd3d44" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="37" d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"/><path fill="#192f5d" d="M0 0h256v258.5H0z"/><g fill="#fff"><circle cx="28" cy="24" r="6"/><circle cx="70" cy="24" r="6"/><circle cx="112" cy="24" r="6"/><circle cx="154" cy="24" r="6"/><circle cx="196" cy="24" r="6"/><circle cx="238" cy="24" r="6"/><circle cx="49" cy="48" r="6"/><circle cx="91" cy="48" r="6"/><circle cx="133" cy="48" r="6"/><circle cx="175" cy="48" r="6"/><circle cx="217" cy="48" r="6"/><circle cx="28" cy="72" r="6"/><circle cx="70" cy="72" r="6"/><circle cx="112" cy="72" r="6"/><circle cx="154" cy="72" r="6"/><circle cx="196" cy="72" r="6"/><circle cx="238" cy="72" r="6"/></g></svg>',
    GB: '<svg viewBox="0 0 640 480" width="20" height="15"><clipPath id="uk-s"><path d="M0 0v480h640V0z"/></clipPath><clipPath id="uk-t"><path d="M320 240L0 0v480zM320 240L640 0v480z"/></clipPath><g clip-path="url(#uk-s)"><path fill="#012169" d="M0 0v480h640V0z"/><path stroke="#fff" stroke-width="60" d="M0 0l640 480M640 0L0 480"/><path stroke="#c8102e" stroke-width="40" d="M0 0l640 480M640 0L0 480" clip-path="url(#uk-t)"/><path stroke="#fff" stroke-width="100" d="M320 0v480M0 240h640"/><path stroke="#c8102e" stroke-width="60" d="M320 0v480M0 240h640"/></g></svg>',
    AE: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#00732f" d="M0 0h640v160H0z"/><path fill="#fff" d="M0 160h640v160H0z"/><path fill="#000" d="M0 320h640v160H0z"/><path fill="#f00" d="M0 0h160v480H0z"/></svg>',
    SG: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#ed2939" d="M0 0h640v240H0z"/><path fill="#fff" d="M0 240h640v240H0z"/><path fill="#fff" d="M125 40a80 80 0 1 0 0 160 85 85 0 1 1 0-160z"/><g fill="#fff" transform="translate(145, 120)"><circle cx="0" cy="-35" r="7"/><circle cx="33" cy="-11" r="7"/><circle cx="21" cy="28" r="7"/><circle cx="-21" cy="28" r="7"/><circle cx="-33" cy="-11" r="7"/></g></svg>',
    AU: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#00008b" d="M0 0h640v480H0z"/><path stroke="#fff" stroke-width="30" d="M0 0l320 240M320 0L0 240"/><path stroke="#f00" stroke-width="20" d="M0 0l320 240M320 0L0 240"/><path stroke="#fff" stroke-width="50" d="M160 0v240M0 120h320"/><path stroke="#f00" stroke-width="30" d="M160 0v240M0 120h320"/><g fill="#fff"><circle cx="480" cy="100" r="14"/><circle cx="420" cy="200" r="14"/><circle cx="540" cy="200" r="14"/><circle cx="480" cy="360" r="14"/><circle cx="160" cy="360" r="28"/></g></svg>',
    CA: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#f00" d="M0 0h160v480H0zM480 0h160v480H480z"/><path fill="#fff" d="M160 0h320v480H160z"/><path fill="#f00" d="M320 120l18 36 38-8-12 38 34 16-36 20 8 36-32-12-18 64-18-64-32 12 8-36-36-20 34-16-12-38 38 8z"/></svg>',
    DE: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#000" d="M0 0h640v160H0z"/><path fill="#dd0000" d="M0 160h640v160H0z"/><path fill="#ffce00" d="M0 320h640v160H0z"/></svg>',
    FR: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#002654" d="M0 0h213.3v480H0z"/><path fill="#fff" d="M213.3 0h213.4v480H213.3z"/><path fill="#ce1126" d="M426.7 0H640v480H426.7z"/></svg>',
    JP: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#fff" d="M0 0h640v480H0z"/><circle cx="320" cy="240" r="120" fill="#bc002d"/></svg>',
    SA: '<svg viewBox="0 0 640 480" width="20" height="15"><path fill="#006c35" d="M0 0h640v480H0z"/><path fill="#fff" d="M160 270h320v15H160z"/><circle cx="320" cy="220" r="30" fill="none" stroke="#fff" stroke-width="6"/></svg>'
  };

  function getFlagSvgByCountry(country) {
    const flags = window.COUNTRY_FLAGS_SVG || PHONE_FLAGS_MAP;
    return flags[country] || PHONE_FLAGS_MAP[country] || PHONE_FLAGS_MAP.IN || '<svg viewBox="0 0 640 480" width="20" height="15"><rect width="640" height="480" fill="#cbd5e1"/></svg>';
  }

  // Close all open custom dropdowns
  function closeAllCustomDropdowns() {
    document.querySelectorAll('.flag-options-overlay').forEach(el => {
      el.style.display = 'none';
    });
    document.querySelectorAll('.flag-dropdown-trigger').forEach(btn => {
      btn.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('.custom-flag-dropdown').forEach(d => {
      d.setAttribute('data-open', 'false');
    });
    activeOpenDropdown = null;
  }

  // Toggle flag dropdown overlay
  function toggleFlagDropdown(target, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const dropdownWrap = document.querySelector(`.custom-flag-dropdown[data-dropdown="${target}"]`);
    if (!dropdownWrap) return;

    const btn = dropdownWrap.querySelector('.flag-dropdown-trigger');
    const overlay = dropdownWrap.querySelector('.flag-options-overlay');
    if (!btn || !overlay) return;

    const isCurrentlyOpen = overlay.style.display !== 'none' && overlay.style.display !== '';

    // Always close any other open dropdowns first
    closeAllCustomDropdowns();

    if (!isCurrentlyOpen) {
      overlay.style.display = 'block';
      btn.setAttribute('aria-expanded', 'true');
      dropdownWrap.setAttribute('data-open', 'true');
      activeOpenDropdown = target;

      // Focus selected option or first option
      const selectedItem = overlay.querySelector('.flag-option-item.selected') || overlay.querySelector('.flag-option-item');
      if (selectedItem) selectedItem.focus();
    }
  }

  // Select a country code option
  function selectCountryOption(target, code, digits, countryCode, countryName) {
    const dropdownWrap = document.querySelector(`.custom-flag-dropdown[data-dropdown="${target}"]`);
    if (dropdownWrap) {
      const codeDisplay = dropdownWrap.querySelector('.flag-code');
      const flagDisplay = dropdownWrap.querySelector('.flag-icon');
      if (codeDisplay) codeDisplay.textContent = code.startsWith('+1-CA') ? '+1' : code;
      if (flagDisplay) flagDisplay.innerHTML = getFlagSvgByCountry(countryCode);

      // Mark option as selected in list
      dropdownWrap.querySelectorAll('.flag-option-item').forEach(item => {
        if (item.getAttribute('data-code') === code) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }

    // Update hidden input or select element
    const hiddenSelect = document.getElementById(target === 'mobile' ? 'mobile-country-code' : 'alt-mobile-country-code');
    if (hiddenSelect) {
      hiddenSelect.value = code;
    }

    // Resize character box digits
    handleCountryCodeChange(target, code, digits);

    // Close overlay
    closeAllCustomDropdowns();

    // Trigger validation counters
    if (typeof window.updateLiveMissingCounters === 'function') {
      window.updateLiveMissingCounters();
    }
  }

  // Update box-count and length on country code change
  function handleCountryCodeChange(target, code, forcedDigits) {
    const wrap = document.querySelector(`.bank-box-wrap[data-target="${target}"]`);
    let digits = forcedDigits;

    if (!digits) {
      const found = COUNTRY_PHONE_LIST.find(c => c.code === code);
      digits = found ? found.digits : 10;
    }

    if (wrap) {
      wrap.setAttribute('data-box-count', String(digits));
      const input = wrap.querySelector('.bank-box-input');
      const cellsContainer = wrap.querySelector('.bank-box-cells');
      if (input) {
        input.maxLength = digits;
        input.value = (input.value || '').replace(/\D/g, '').slice(0, digits);
      }
      if (cellsContainer) {
        let cellsHtml = '';
        for (let i = 0; i < digits; i++) {
          cellsHtml += `<span class="char-cell notranslate" translate="no" data-idx="${i}">&nbsp;</span>`;
        }
        cellsContainer.innerHTML = cellsHtml;
        if (input && input.value && typeof window.updateBoxCells === 'function') {
          window.updateBoxCells(wrap, input.value);
        }
      }
    }

    if (target === 'mobile') {
      const rawInput = document.getElementById('raw-mobile-number');
      const hPhone = document.getElementById('hidden-phone');
      if (rawInput && hPhone) {
        const cleanCode = code.startsWith('+1-CA') ? '+1' : code;
        hPhone.value = rawInput.value ? `${cleanCode}${rawInput.value}` : '';
      }
    }

    if (typeof window.debounceSaveDraft === 'function') {
      window.debounceSaveDraft();
    }
  }

  // Render and initialize custom flag dropdowns
  function initCustomFlagDropdowns() {
    ['mobile', 'altMobile'].forEach(target => {
      const dropdownWrap = document.querySelector(`.custom-flag-dropdown[data-dropdown="${target}"]`);
      if (!dropdownWrap) return;

      const overlay = dropdownWrap.querySelector('.flag-options-overlay');
      const hiddenSelect = document.getElementById(target === 'mobile' ? 'mobile-country-code' : 'alt-mobile-country-code');
      const currentVal = (hiddenSelect && hiddenSelect.value) || '+91';

      if (overlay) {
        let optionsHtml = '';
        COUNTRY_PHONE_LIST.forEach(item => {
          const isSelected = item.code === currentVal;
          const display = item.displayCode || item.code;
          const flagSvg = getFlagSvgByCountry(item.country);
          optionsHtml += `
            <li class="flag-option-item ${isSelected ? 'selected' : ''}"
                role="option"
                tabindex="0"
                data-code="${item.code}"
                data-digits="${item.digits}"
                data-country="${item.country}"
                onclick="selectCountryOption('${target}', '${item.code}', ${item.digits}, '${item.country}', '${item.name}')">
              <span class="flag-icon">${flagSvg}</span>
              <span class="flag-code">${display}</span>
              <span class="flag-option-country-name">${item.name}</span>
            </li>
          `.trim();
        });
        overlay.innerHTML = optionsHtml;
        overlay.style.display = 'none'; // Explicitly starts closed
      }

      // Initialize trigger button display
      const currentItem = COUNTRY_PHONE_LIST.find(c => c.code === currentVal) || COUNTRY_PHONE_LIST[0];
      const flagDisplay = dropdownWrap.querySelector('.flag-icon');
      const codeDisplay = dropdownWrap.querySelector('.flag-code');
      if (flagDisplay) flagDisplay.innerHTML = getFlagSvgByCountry(currentItem.country);
      if (codeDisplay) codeDisplay.textContent = currentItem.displayCode || currentItem.code;

      const triggerBtn = dropdownWrap.querySelector('.flag-dropdown-trigger');
      if (triggerBtn) {
        triggerBtn.setAttribute('aria-expanded', 'false');

        // Keyboard navigation on trigger button
        triggerBtn.addEventListener('keydown', (e) => {
          if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            toggleFlagDropdown(target, e);
          } else if (e.key === 'Escape') {
            closeAllCustomDropdowns();
          }
        });
      }
    });
  }

  // Global document click & keydown listeners for closing dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-flag-dropdown')) {
      closeAllCustomDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllCustomDropdowns();
    }
  });

  // =================================================================
  // ITEM 3: INLINE CUSTOM EMAIL DOMAIN LOGIC (NO MODAL / NO POPUP)
  // =================================================================
  function handleEmailDomainChange(val) {
    const dSel = document.getElementById('email-domain-select');
    const inlineWrap = document.getElementById('email-domain-custom-inline');
    const inlineInput = document.getElementById('inline-custom-domain-input');
    const errorEl = document.getElementById('inline-custom-domain-error');

    if (val === 'OTHER') {
      if (dSel) dSel.style.display = 'none';
      if (inlineWrap) inlineWrap.style.display = 'inline-flex';
      if (errorEl) errorEl.style.display = 'none';

      if (inlineInput) {
        inlineInput.value = '';
        inlineInput.focus();
      }
    } else {
      window.previousEmailDomain = val;
      syncCombinedEmail();
      if (typeof window.debounceSaveDraft === 'function') {
        window.debounceSaveDraft();
      }
    }
  }

  function saveInlineCustomDomain() {
    const inlineInput = document.getElementById('inline-custom-domain-input');
    const dSel = document.getElementById('email-domain-select');
    const inlineWrap = document.getElementById('email-domain-custom-inline');
    const errorEl = document.getElementById('inline-custom-domain-error');
    if (!inlineInput || !dSel) return;

    let domain = inlineInput.value.trim().toLowerCase().replace(/^@+/, '');

    // Validate domain: name.tld, no spaces, no @
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}$/;
    if (!domain || !domainRegex.test(domain) || domain.includes(' ') || domain.includes('@')) {
      if (errorEl) {
        errorEl.textContent = 'Please enter a valid domain (e.g. company.com)';
        errorEl.style.display = 'block';
      }
      inlineInput.focus();
      return;
    }

    const fullDomain = '@' + domain;
    window.previousEmailDomain = fullDomain;

    // Check if option already exists in select
    let existingOpt = null;
    for (let opt of dSel.options) {
      if (opt.value === fullDomain) {
        existingOpt = opt;
        break;
      }
    }

    if (!existingOpt) {
      const newOpt = document.createElement('option');
      newOpt.value = fullDomain;
      newOpt.textContent = fullDomain;
      const otherOpt = dSel.querySelector('option[value="OTHER"]');
      if (otherOpt) {
        dSel.insertBefore(newOpt, otherOpt);
      } else {
        dSel.appendChild(newOpt);
      }
      existingOpt = newOpt;
    }

    dSel.value = fullDomain;
    if (inlineWrap) inlineWrap.style.display = 'none';
    dSel.style.display = '';
    if (errorEl) errorEl.style.display = 'none';

    syncCombinedEmail();

    if (typeof window.debounceSaveDraft === 'function') {
      window.debounceSaveDraft();
    }
    if (typeof window.updateLiveMissingCounters === 'function') {
      window.updateLiveMissingCounters();
    }
  }

  function cancelInlineCustomDomain() {
    const dSel = document.getElementById('email-domain-select');
    const inlineWrap = document.getElementById('email-domain-custom-inline');
    const errorEl = document.getElementById('inline-custom-domain-error');

    if (dSel) {
      dSel.value = window.previousEmailDomain && window.previousEmailDomain !== 'OTHER' 
        ? window.previousEmailDomain 
        : '@gmail.com';
      dSel.style.display = '';
    }
    if (inlineWrap) inlineWrap.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    syncCombinedEmail();
  }

  // Standardize multi-option dropdowns across the system with strict A-Z alphabetical ordering
  function standardizeAndSortDropdownOptions() {
    document.querySelectorAll('select:not(.no-sort):not(.neobank-lang-select)').forEach(select => {
      if (select.dataset.sortedAlpha === 'true') return;
      const options = Array.from(select.options);
      if (options.length <= 3) return;

      const currentVal = select.value;
      const leadingPlaceholder = (options[0] && (options[0].value === '' || options[0].textContent.includes('--') || options[0].textContent.includes('Select'))) ? options[0] : null;
      const trailingOther = options.find(opt => opt.value === 'OTHER' || opt.textContent.toLowerCase().includes('other / custom'));

      const toSort = options.filter(opt => opt !== leadingPlaceholder && opt !== trailingOther);
      toSort.sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), undefined, { sensitivity: 'base' }));

      // Clear and re-append in strict alphabetical order
      select.innerHTML = '';
      if (leadingPlaceholder) select.appendChild(leadingPlaceholder);
      toSort.forEach(opt => select.appendChild(opt));
      if (trailingOther) select.appendChild(trailingOther);

      select.value = currentVal;
      select.dataset.sortedAlpha = 'true';
    });
  }

  // Keyboard controls for inline domain input & initialization
  function setupDropdownListeners() {
    initCustomFlagDropdowns();
    standardizeAndSortDropdownOptions();

    const inlineInput = document.getElementById('inline-custom-domain-input');
    if (inlineInput && !inlineInput.dataset.listenersBound) {
      inlineInput.dataset.listenersBound = 'true';
      inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveInlineCustomDomain();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelInlineCustomDomain();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDropdownListeners);
  } else {
    setupDropdownListeners();
  }

  // Prefix "Other" toggle across form sections
  function handlePrefixChange(val, target = 'primary') {
    let otherInput = document.getElementById('prefix-other-input');
    if (target === 'guardian') otherInput = document.getElementById('prefix-guardian-other-input');
    else if (target === 'nominee') otherInput = document.getElementById('prefix-nominee-other-input');
    else if (target === 'joint2') otherInput = document.getElementById('prefix-joint2-other-input');
    else if (target === 'joint3') otherInput = document.getElementById('prefix-joint3-other-input');

    if (otherInput) {
      if (val === 'Other') {
        otherInput.style.display = 'inline-block';
        otherInput.focus();
      } else {
        otherInput.style.display = 'none';
        otherInput.value = '';
      }
    }

    if (typeof window.updateLiveMissingCounters === 'function') {
      window.updateLiveMissingCounters();
    }
    if (typeof window.debounceSaveDraft === 'function') {
      window.debounceSaveDraft();
    }
  }

  // "Others" toggle across the form (marital, nationality, religion, emp)
  function handleOtherToggle(category, isOther) {
    let targetInput = null;
    if (category === 'marital') targetInput = document.getElementById('marital-other-input');
    else if (category === 'nationality') targetInput = document.getElementById('nationality-other-input');
    else if (category === 'religion') targetInput = document.getElementById('religion-other-input');
    else if (category === 'emp') targetInput = document.getElementById('emp-other-input');

    if (targetInput) {
      targetInput.style.display = isOther ? 'block' : 'none';
      if (isOther) targetInput.focus();
      else targetInput.value = '';
    }

    if (typeof window.updateLiveMissingCounters === 'function') {
      window.updateLiveMissingCounters();
    }
    if (typeof window.debounceSaveDraft === 'function') {
      window.debounceSaveDraft();
    }
  }

  // Bidirectional Home Branch sync
  function syncBranchSelection(val) {
    const s1 = document.getElementById('step1-branch-select');
    const s2 = document.getElementById('step2-branch-select');
    if (s1 && s1.value !== val) s1.value = val;
    if (s2 && s2.value !== val) s2.value = val;

    const activeSelect = (s1 && s1.value === val) ? s1 : s2;
    let code = '';
    if (activeSelect && activeSelect.selectedOptions && activeSelect.selectedOptions[0]) {
      code = activeSelect.selectedOptions[0].getAttribute('data-code') || '';
    }
    const branchDir = window.BRANCH_DIRECTORY || {};
    if (!code && val && branchDir[val]) {
      code = branchDir[val].code;
    }

    const c1 = document.getElementById('step1-branch-code');
    const c2 = document.getElementById('step2-branch-code');
    if (c1) c1.value = code;
    if (c2) c2.value = code;

    if (typeof window.updateLiveMissingCounters === 'function') {
      window.updateLiveMissingCounters();
    }
    if (typeof window.debounceSaveDraft === 'function') {
      window.debounceSaveDraft();
    }
  }

  function syncCombinedEmail() {
    const uInp = document.getElementById('email-username');
    const dSel = document.getElementById('email-domain-select');
    const hEmail = document.getElementById('hidden-combined-email');
    if (uInp && dSel && hEmail) {
      const u = uInp.value.trim();
      const d = dSel.value === 'OTHER' ? (window.previousEmailDomain || '@gmail.com') : dSel.value;
      hEmail.value = u ? `${u}${d}` : '';
    }
  }

  // Export module APIs
  window.COUNTRY_PHONE_LIST = COUNTRY_PHONE_LIST;
  window.initCustomFlagDropdowns = initCustomFlagDropdowns;
  window.toggleFlagDropdown = toggleFlagDropdown;
  window.selectCountryOption = selectCountryOption;
  window.closeAllCustomDropdowns = closeAllCustomDropdowns;
  window.handleCountryCodeChange = handleCountryCodeChange;
  window.handleEmailDomainChange = handleEmailDomainChange;
  window.saveInlineCustomDomain = saveInlineCustomDomain;
  window.cancelInlineCustomDomain = cancelInlineCustomDomain;
  window.syncCombinedEmail = syncCombinedEmail;
  window.handlePrefixChange = handlePrefixChange;
  window.handleOtherToggle = handleOtherToggle;
  window.syncBranchSelection = syncBranchSelection;

})(typeof window !== 'undefined' ? window : this);
