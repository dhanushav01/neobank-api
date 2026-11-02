/**
 * NeoBank Core Banking Platform - Form 101-A Validation & Live Missing Counter Engine
 * 
 * Features:
 * 1. Live accurate "N Missing" section badges and page-tab counters.
 * 2. Each section counts ONLY its own required fields that are empty or invalid.
 * 3. Page tab counter is the exact sum of its own sections.
 * 4. Conditional fields counted only when applicable (Middle Name, Minor Guardian, PEP, Disability, PAN vs Form 60, Custom Email Domain).
 * 5. Prefilled date counts as filled.
 * 6. Live updates on every keypress and change, decreasing by exactly 1 per completed field.
 * 7. Section at 0 shows green "✓ Complete".
 */
(function(window) {
  'use strict';

  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ----------------------------------------------------------------- DATE VALIDATION
  function validateDateString(valStr, isDob = false) {
    if (!valStr || !valStr.trim()) {
      return { valid: false, error: 'Date is required' };
    }
    let clean = String(valStr).replace(/[^0-9]/g, '');
    if (clean.length !== 8) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(valStr.trim())) {
        const parts = valStr.trim().split('-');
        clean = parts[2] + parts[1] + parts[0];
      } else {
        return { valid: false, error: 'Complete 8-digit date required (DDMMYYYY)' };
      }
    }

    const d = parseInt(clean.substring(0, 2), 10);
    const m = parseInt(clean.substring(2, 4), 10);
    const y = parseInt(clean.substring(4, 8), 10);

    if (y < 1900) {
      return { valid: false, error: 'Year cannot be earlier than 1900' };
    }
    const today = new Date();
    if (y > today.getFullYear()) {
      return { valid: false, error: 'Future dates are not allowed' };
    }
    if (m < 1 || m > 12) {
      return { valid: false, error: 'Month must be between 01 and 12' };
    }

    const daysInMonth = new Date(y, m, 0).getDate();
    if (d < 1 || d > daysInMonth) {
      return { valid: false, error: `Day must be between 01 and ${daysInMonth}` };
    }

    const dateObj = new Date(y, m - 1, d);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (dateObj > todayEnd) {
      return { valid: false, error: 'Future dates are not allowed' };
    }

    if (isDob) {
      let age = today.getFullYear() - y;
      const mDiff = today.getMonth() - (m - 1);
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < d)) {
        age--;
      }

      const accCategory = document.querySelector('input[name="accCategoryRadio"]:checked')?.value || 'NORMAL';
      const accType = document.getElementById('apply-selected-account-type')?.value || 'SAVINGS';

      if (accCategory === 'MINOR') {
        if (age >= 18) {
          return { valid: false, error: 'Minor category requires age under 18' };
        }
      } else if (accType === 'STUDENT') {
        if (age < 16 || age > 26) {
          return { valid: false, error: 'Student account requires age between 16 and 26' };
        }
      } else {
        if (age < 18) {
          return { valid: false, error: 'Standard account requires age 18 or above (select Minor for under 18)' };
        }
      }
    }

    return { valid: true, day: d, month: m, year: y };
  }

  // ----------------------------------------------------------------- LIVE MISSING COUNTERS ENGINE
  function calculateSectionMissingCounts() {
    if (typeof document === 'undefined') return null;

    // SECTION 0: Top Header Table (Page 1)
    let sec0 = 0;
    const appType = document.querySelector('input[name="appTypeRadio"]:checked');
    if (!appType) sec0++;

    const accCat = document.querySelector('input[name="accCategoryRadio"]:checked');
    if (!accCat) sec0++;

    const appDateVal = document.getElementById('raw-header-date')?.value?.trim();
    // Prefilled date counts as filled if valid
    const appDateValid = appDateVal ? validateDateString(appDateVal, false).valid : false;
    if (!appDateValid) sec0++;

    const branch = document.getElementById('step2-branch-select')?.value || document.getElementById('step1-branch-select')?.value;
    if (!branch) sec0++;

    // SECTION 1: Personal Details (Page 1)
    let sec1 = 0;
    const prefix = document.querySelector('input[name="namePrefix"]:checked');
    if (!prefix) sec1++;

    const firstName = document.getElementById('raw-first-name')?.value?.trim();
    if (!firstName) sec1++;

    // Middle name is optional, not counted as missing

    const lastName = document.getElementById('raw-last-name')?.value?.trim();
    if (!lastName) sec1++;

    const fatherName = document.getElementById('raw-father-name')?.value?.trim();
    if (!fatherName) sec1++;

    const motherName = document.getElementById('raw-mother-name')?.value?.trim();
    if (!motherName) sec1++;

    const dobVal = document.getElementById('raw-dob-date')?.value?.trim() || document.getElementById('raw-dob')?.value?.trim();
    if (!dobVal || !validateDateString(dobVal, true).valid) sec1++;

    const gender = document.querySelector('input[name="genderRadio"]:checked');
    if (!gender) sec1++;

    const marital = document.querySelector('input[name="maritalRadio"]:checked');
    if (!marital) sec1++;

    const nationality = document.querySelector('input[name="nationalityRadio"]:checked');
    if (!nationality) sec1++;

    // Guardian conditional: Only if Minor
    const isMinor = accCat && accCat.value === 'MINOR';
    if (isMinor) {
      const guardian = document.getElementById('raw-guardian-name')?.value?.trim();
      if (!guardian) sec1++;
    }

    // SECTION 2: Occupation & Financial Profile (Page 1)
    let sec2 = 0;
    const empStatus = document.querySelector('input[name="empStatusRadio"]:checked');
    if (!empStatus) sec2++;

    const annualIncome = parseFloat(document.getElementById('input-annual-income')?.value || '0');
    if (isNaN(annualIncome) || annualIncome <= 0) sec2++;

    const incomeBracket = document.querySelector('input[name="incomeBracketRadio"]:checked');
    if (!incomeBracket) sec2++;

    const sourceFunds = document.querySelector('input[name="sourceFundsRadio"]:checked');
    if (!sourceFunds) sec2++;

    // SECTION 3: Identification & Tax Information (Page 1)
    let sec3 = 0;
    const form60 = document.querySelector('input[name="form60Radio"]:checked')?.value === 'YES';
    if (!form60) {
      const panVal = document.getElementById('raw-pan-number')?.value?.trim() || document.querySelector('input[name="taxId"]')?.value?.trim();
      if (!panVal || panVal.length < 10) sec3++;
    }
    const aadhaarVal = document.getElementById('raw-aadhaar-number')?.value?.trim() || document.querySelector('input[name="aadhaarNumber"]')?.value?.trim();
    if (!aadhaarVal || aadhaarVal.length < 12) sec3++;

    // Disability conditional: Only if Yes
    const disChoice = document.querySelector('input[name="disabilityRadio"]:checked')?.value;
    if (disChoice === 'YES') {
      const disDesc = document.querySelector('input[name="disabilityDesc"]')?.value?.trim();
      if (!disDesc) sec3++;
    }

    // PEP conditional: Only if PEP/YES
    const pepChoice = document.querySelector('input[name="pepRadio"]:checked')?.value;
    if (pepChoice === 'PEP' || pepChoice === 'RELATED_PEP' || pepChoice === 'YES') {
      const pepCountry = document.querySelector('input[name="pepCountry"]')?.value?.trim();
      if (!pepCountry) sec3++;
    }

    // SECTION 4: Contact Details (Page 1)
    let sec4 = 0;
    const mobile = document.getElementById('raw-mobile-number')?.value?.trim();
    if (!mobile || mobile.length < 8) sec4++;

    // Email username + domain
    const emailUser = document.getElementById('email-username')?.value?.trim();
    const emailDomain = document.getElementById('email-domain-select')?.value;
    if (!emailUser) {
      sec4++;
    } else if (emailDomain === 'OTHER') {
      const customDomain = document.getElementById('inline-custom-domain-input')?.value?.trim();
      const validDomain = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}$/.test(customDomain || '');
      if (!validDomain) sec4++;
    }

    // SECTION OVD: Proof of Identity / Address (Page 2)
    let secOvd = 0;
    const checkedOvd = document.querySelectorAll('input[name="ovdSelectChk"]:checked');
    let hasValidOvd = false;

    // Check all checked OVD rows for either a file upload, text value, or valid Aadhaar
    checkedOvd.forEach(chk => {
      const row = chk.closest('tr');
      if (row) {
        // 1. File input has an attached file
        const fileInp = row.querySelector('input[type="file"]');
        if (fileInp && fileInp.files && fileInp.files.length > 0) {
          hasValidOvd = true;
        }

        // 2. Status span displays an uploaded file (e.g. "✓ filename.pdf")
        const statusSpan = row.querySelector('span[id^="ovd-status-"]');
        const spanTxt = statusSpan ? statusSpan.textContent.trim() : '';
        if (spanTxt && spanTxt !== 'No file' && !spanTxt.includes('No file')) {
          hasValidOvd = true;
        }

        // 3. Document / Reference number entered in this row
        const textInps = row.querySelectorAll('input[type="text"]');
        textInps.forEach(inp => {
          if (inp.value && inp.value.trim().length > 0) {
            hasValidOvd = true;
          }
        });
      }

      // 4. Aadhaar row valid if 12-digit Aadhaar was filled in Section 3
      if (chk.value === 'AADHAAR') {
        const aVal = document.getElementById('raw-aadhaar-number')?.value?.trim();
        if (aVal && aVal.length >= 12) {
          hasValidOvd = true;
        }
      }
    });

    // Also check if ANY OVD certified copy file was uploaded across the whole table
    if (!hasValidOvd) {
      const allOvdFileSpans = document.querySelectorAll('span[id^="ovd-status-"]');
      for (const sp of allOvdFileSpans) {
        const txt = sp.textContent ? sp.textContent.trim() : '';
        if (txt && txt !== 'No file' && !txt.includes('No file')) {
          hasValidOvd = true;
          break;
        }
      }
    }

    if (!hasValidOvd) {
      const allOvdFileInputs = document.querySelectorAll('input[type="file"][id^="file-ovd-"]');
      for (const fi of allOvdFileInputs) {
        if (fi.files && fi.files.length > 0) {
          hasValidOvd = true;
          break;
        }
      }
    }

    if (!hasValidOvd) secOvd++;

    // SECTION ADDR: Address Details (Page 2)
    let secAddr = 0;
    const addrHouse = document.getElementById('input-addr-house')?.value?.trim();
    if (!addrHouse) secAddr++;

    const addrCity = document.getElementById('input-city')?.value?.trim();
    if (!addrCity) secAddr++;

    const addrState = document.getElementById('input-state')?.value?.trim();
    if (!addrState) secAddr++;

    const pincode = document.getElementById('raw-pincode')?.value?.trim() || document.querySelector('input[name="postalCode"]')?.value?.trim();
    if (!pincode || pincode.length !== 6) secAddr++;

    // SECTION PHOTO_SIG: Applicant Photograph & Verification Signature (Page 2)
    let secPhotoSig = 0;
    const photo = document.getElementById('input-applicant-photo-data')?.value?.trim() || document.getElementById('applicant-photo-preview')?.getAttribute('src');
    if (!photo || photo === '#' || photo.includes('placeholder')) secPhotoSig++;

    const sig = document.getElementById('input-applicant-signature-data')?.value?.trim();
    const thumb = document.getElementById('input-applicant-thumb-data')?.value?.trim();
    if (!sig && !thumb) secPhotoSig++;

    // SECTION PART2_ACC: Account Type & Deposit (Page 3)
    let secPart2Acc = 0;
    const accType = window.selectedAccountType || document.getElementById('apply-selected-account-type')?.value;
    if (!accType) secPart2Acc++;

    const deposit = document.getElementById('input-initial-deposit')?.value?.trim();
    if (deposit === '' || isNaN(parseFloat(deposit))) secPart2Acc++;

    const password = document.getElementById('input-password')?.value?.trim();
    if (!password || password.length < 8) secPart2Acc++;

    // SECTION NOMINATION: Nomination Details (Page 4)
    let secNom = 0;
    const nomChoice = document.querySelector('input[name="nominationChoiceRadio"]:checked')?.value || 'REGISTER';
    if (nomChoice === 'REGISTER') {
      const nomName = document.getElementById('raw-nominee-name')?.value?.trim();
      if (!nomName) secNom++;
    }

    // SECTION FATCA: FATCA Declaration (Page 4)
    let secFatca = 0;
    const fatca = document.querySelector('input[name="fatcaRadio"]:checked');
    if (!fatca) secFatca++;

    // SECTION PART3_DECL: Final Declaration (Page 4)
    let secPart3Decl = 0;
    const part3Sig = document.getElementById('part3-sig1-preview')?.getAttribute('data-signed') === 'true' ||
                     document.getElementById('input-applicant-signature-data')?.value?.trim();
    if (!part3Sig) secPart3Decl++;

    const tab1 = sec0 + sec1 + sec2 + sec3 + sec4;
    const tab1Cont = secOvd + secAddr + secPhotoSig;
    const tab2 = secPart2Acc;
    const tab3 = secNom + secFatca + secPart3Decl;

    return {
      sec0, sec1, sec2, sec3, sec4,
      secOvd, secAddr, secPhotoSig,
      secPart2Acc,
      secNom, secFatca, secPart3Decl,
      tab1, tab1Cont, tab2, tab3
    };
  }

  // Floating Tooltip Singleton for Tab and Section Badges
  let activeTooltipEl = null;
  let tooltipDismissTimer = null;

  function hideFloatingTooltip() {
    if (activeTooltipEl) {
      activeTooltipEl.remove();
      activeTooltipEl = null;
    }
  }

  function showFloatingTooltip(anchorEl, title, count, fields) {
    hideFloatingTooltip();
    if (!fields || fields.length === 0) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'neobank-tab-tooltip';
    tooltip.className = 'notranslate';
    tooltip.setAttribute('translate', 'no');

    const fieldsHtml = fields.map(f => `
      <li onclick="window.focusValidationField('${esc(f.elId)}', '${esc(f.part)}')" title="Click to jump directly to this field">
        • ${esc(f.label)}
      </li>
    `).join('');

    tooltip.innerHTML = `
      <div class="neobank-tab-tooltip-header">
        <span>${esc(title)}</span>
        <span class="neobank-tab-tooltip-count">${esc(count)} missing</span>
      </div>
      <ul class="neobank-tab-tooltip-list custom-scrollbar">
        ${fieldsHtml}
      </ul>
      <div class="neobank-tab-tooltip-hint">Click any field to jump directly</div>
    `;

    document.body.appendChild(tooltip);
    activeTooltipEl = tooltip;

    // Position tooltip directly below anchor element
    const rect = anchorEl.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth || 280;
    let leftPos = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    if (leftPos < 10) leftPos = 10;
    if (leftPos + tooltipWidth > window.innerWidth - 10) {
      leftPos = window.innerWidth - tooltipWidth - 10;
    }
    const topPos = rect.bottom + window.scrollY + 6;

    tooltip.style.left = `${leftPos}px`;
    tooltip.style.top = `${topPos}px`;

    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(tooltipDismissTimer);
    });
    tooltip.addEventListener('mouseleave', () => {
      tooltipDismissTimer = setTimeout(hideFloatingTooltip, 150);
    });
  }

  // Helper to mount or update a badge on a section header with hover tooltip
  function setSectionBadge(headerId, count, secTitle, secFields) {
    const headerEl = document.getElementById(headerId);
    if (!headerEl) return;

    let badge = headerEl.querySelector('.section-counter-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'section-counter-badge notranslate hidden';
      badge.setAttribute('translate', 'no');
      headerEl.appendChild(badge);
    }

    if (!window.hasAttemptedSubmit || !count || count <= 0) {
      badge.className = 'section-counter-badge notranslate hidden';
      badge.textContent = '';
      badge.style.setProperty('display', 'none', 'important');
      return;
    }

    badge.className = 'section-counter-badge missing visible notranslate';
    badge.setAttribute('translate', 'no');
    badge.textContent = `${count} Missing`;
    badge.style.setProperty('display', 'inline-flex', 'important');

    if (!headerEl._hasTooltipListeners) {
      headerEl._hasTooltipListeners = true;
      headerEl.addEventListener('mouseenter', () => {
        if (!window.hasAttemptedSubmit) return;
        const currentData = headerEl._tooltipData;
        if (currentData && currentData.count > 0) {
          clearTimeout(tooltipDismissTimer);
          showFloatingTooltip(badge || headerEl, currentData.title, currentData.count, currentData.fields);
        }
      });
      headerEl.addEventListener('mouseleave', () => {
        tooltipDismissTimer = setTimeout(hideFloatingTooltip, 180);
      });
    }

    headerEl._tooltipData = { title: secTitle || 'Section Missing Fields', count, fields: secFields || [] };
  }

  // Helper to mount or update a tab counter badge with hover tooltip
  function setTabBadge(btnId, badgeId, count, title, fields) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    let badge = btn.querySelector('.tab-missing-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.id = badgeId;
      badge.className = 'tab-missing-badge notranslate hidden';
      badge.setAttribute('translate', 'no');
      btn.appendChild(badge);
    }

    if (!window.hasAttemptedSubmit || !count || count <= 0) {
      badge.className = 'tab-missing-badge notranslate hidden';
      badge.textContent = '';
      badge.style.setProperty('display', 'none', 'important');
      return;
    }

    badge.className = 'tab-missing-badge visible notranslate';
    badge.textContent = `(${count})`;
    badge.style.setProperty('display', 'inline-flex', 'important');

    if (!btn._hasTooltipListeners) {
      btn._hasTooltipListeners = true;
      btn.addEventListener('mouseenter', () => {
        if (!window.hasAttemptedSubmit) return;
        const currentData = btn._tooltipData;
        if (currentData && currentData.count > 0) {
          clearTimeout(tooltipDismissTimer);
          showFloatingTooltip(btn, currentData.title, currentData.count, currentData.fields);
        }
      });
      btn.addEventListener('mouseleave', () => {
        tooltipDismissTimer = setTimeout(hideFloatingTooltip, 180);
      });
    }

    btn._tooltipData = { title: title || 'Page Missing Fields', count, fields: fields || [] };
  }

  window.hasAttemptedSubmit = false;

  function updateLiveMissingCounters() {
    const report = getDetailedValidationReport();
    if (!report) return;

    // Group fields by page
    const page1Fields = [];
    const page2Fields = [];
    const page3Fields = [];
    const page4Fields = [];

    // Map section IDs to their fields for section bar tooltips
    const secMap = {};

    report.sections.forEach(sec => {
      secMap[sec.id] = { title: sec.name, count: sec.count, fields: sec.fields };
      if (sec.part === 'part1') page1Fields.push(...sec.fields);
      else if (sec.part === 'part1-cont') page2Fields.push(...sec.fields);
      else if (sec.part === 'part2') page3Fields.push(...sec.fields);
      else if (sec.part === 'part3') page4Fields.push(...sec.fields);
    });

    // Page 1 Section Badges
    const s0 = secMap['sec-header'] || { count: 0, fields: [] };
    const s1 = secMap['sec-personal'] || { count: 0, fields: [] };
    const s2 = secMap['sec-financial'] || { count: 0, fields: [] };
    const s3 = secMap['sec-id-tax'] || { count: 0, fields: [] };
    const s4 = secMap['sec-contact'] || { count: 0, fields: [] };

    setSectionBadge('header-sec-0', s0.count, 'Form Header & Branch', s0.fields);
    setSectionBadge('header-sec-1', s1.count, 'Personal Details', s1.fields);
    setSectionBadge('header-sec-2', s2.count, 'Occupation & Financial', s2.fields);
    setSectionBadge('header-sec-3', s3.count, 'Identification & Tax', s3.fields);
    setSectionBadge('header-sec-4', s4.count, 'Contact Details', s4.fields);

    // Page 2 Section Badges
    const sOvd = secMap['sec-ovd'] || { count: 0, fields: [] };
    const sAddr = secMap['sec-address'] || { count: 0, fields: [] };
    const sPhoto = secMap['sec-photo-sig'] || { count: 0, fields: [] };

    setSectionBadge('header-sec-ovd', sOvd.count, 'Proof of Identity / Address (OVD)', sOvd.fields);
    setSectionBadge('header-sec-addr', sAddr.count, 'Address Details', sAddr.fields);
    setSectionBadge('header-sec-photo-sig', sPhoto.count, 'Applicant Photo & Signature', sPhoto.fields);

    // Page 3 Section Badges
    const sAcc = secMap['sec-account'] || { count: 0, fields: [] };
    setSectionBadge('header-sec-part2-acc', sAcc.count, 'Account Type & Services', sAcc.fields);
    setSectionBadge('header-sec-part2-deposit', sAcc.count, 'Initial Deposit', sAcc.fields);

    // Page 4 Section Badges
    const sNom = secMap['sec-nomination'] || { count: 0, fields: [] };
    const sFatca = secMap['sec-fatca'] || { count: 0, fields: [] };
    const sDecl = secMap['sec-declaration'] || { count: 0, fields: [] };

    setSectionBadge('header-sec-nomination', sNom.count, 'Nomination Details', sNom.fields);
    setSectionBadge('header-sec-fatca', sFatca.count, 'FATCA Declaration', sFatca.fields);
    setSectionBadge('header-sec-part3-decl', sDecl.count, 'Final Applicant Declarations', sDecl.fields);

    // Tab Badges with rich hover tooltips
    setTabBadge('btn-tab-part1', 'tab-missing-badge-part1', page1Fields.length, 'Page 1: CIF & CKYC', page1Fields);
    setTabBadge('btn-tab-part1-cont', 'tab-missing-badge-part1-cont', page2Fields.length, 'Page 2: KYC & OVD', page2Fields);
    setTabBadge('btn-tab-part2', 'tab-missing-badge-part2', page3Fields.length, 'Page 3: Account Form', page3Fields);
    setTabBadge('btn-tab-part3', 'tab-missing-badge-part3', page4Fields.length, 'Page 4: Declarations', page4Fields);

    const allFields = [...page1Fields, ...page2Fields, ...page3Fields, ...page4Fields];
    setTabBadge('btn-tab-all', 'tab-missing-badge-all', allFields.length, 'View All 4 Pages', allFields);

    // Suppress big banner
    const banner = document.getElementById('validation-summary-banner');
    if (banner) {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }

  // Real-time event listeners on typing, selection change, and blur
  if (typeof document !== 'undefined') {
    document.addEventListener('input', () => {
      updateLiveMissingCounters();
    });
    document.addEventListener('change', () => {
      updateLiveMissingCounters();
    });
    document.addEventListener('DOMContentLoaded', () => {
      updateLiveMissingCounters();
    });
  }

  // ----------------------------------------------------------------- DYNAMIC CLEAR ERROR ON VALID INPUT
  function clearErrorOnValidInput(target) {
    if (!target) return;
    const wrap = target.closest ? target.closest('.bank-box-wrap') : null;
    if (wrap) {
      const targetName = wrap.getAttribute('data-target') || target.name || target.id;
      const val = target.value ? target.value.trim() : '';
      let isValid = false;

      if (targetName === 'applicationDate' || target.id === 'raw-header-date') {
        isValid = validateDateString(val, false).valid;
      } else if (targetName === 'dob' || target.id === 'raw-dob-date') {
        isValid = validateDateString(val, true).valid;
      } else if (targetName === 'taxId' || target.id === 'raw-pan-number') {
        isValid = val.length >= 10;
      } else if (targetName === 'aadhaarNumber' || target.id === 'raw-aadhaar-number') {
        isValid = val.length >= 12;
      } else if (targetName === 'mobile' || target.id === 'raw-mobile-number') {
        isValid = val.length >= 8;
      } else if (targetName === 'postalCode' || targetName === 'corrPostalCode' || target.id === 'raw-pincode') {
        isValid = val.length >= 6;
      } else {
        isValid = val.length > 0;
      }

      if (isValid) {
        wrap.classList.remove('field-invalid-mandatory');
        wrap.querySelectorAll('.char-cell').forEach(c => c.classList.remove('cell-invalid'));
        const labelEl = wrap.closest('.char-input-group')?.querySelector('.char-input-label-row span') ||
                        document.getElementById('label-dob') ||
                        wrap.closest('td')?.querySelector('strong') ||
                        wrap.parentElement?.querySelector('label');
        if (labelEl) labelEl.classList.remove('label-invalid-mandatory');
      }
    } else {
      let isValid = false;
      if (target.type === 'radio') {
        isValid = true;
        const container = target.closest('td') || target.closest('div');
        if (container) {
          container.classList.remove('field-invalid-mandatory');
          const strong = container.querySelector('strong') || container.parentElement?.querySelector('label') || container.parentElement?.querySelector('span');
          if (strong) {
            strong.classList.remove('label-invalid-mandatory');
            strong.classList.remove('field-invalid-mandatory');
          }
        }
        if (target.name === 'genderRadio') {
          const lbl = document.getElementById('label-gender');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        } else if (target.name === 'empStatusRadio') {
          const lbl = document.getElementById('label-emp-status');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        } else if (target.name === 'incomeBracketRadio') {
          const lbl = document.getElementById('label-income-bracket');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        } else if (target.name === 'sourceFundsRadio') {
          const lbl = document.getElementById('label-source-funds');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        } else if (target.name === 'maritalRadio') {
          const lbl = document.getElementById('label-marital');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        } else if (target.name === 'nationalityRadio') {
          const lbl = document.getElementById('label-nationality');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        } else if (target.name === 'namePrefix') {
          const lbl = document.getElementById('label-name-prefix');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        }
      } else if (target.type === 'checkbox') {
        isValid = target.checked;
        if (target.name === 'ovdSelectChk') {
          const ovdHeader = document.getElementById('header-sec-ovd');
          if (ovdHeader) {
            ovdHeader.classList.remove('field-invalid-mandatory');
            ovdHeader.classList.remove('label-invalid-mandatory');
          }
          const ovdTable = document.querySelector('.bank-table-grid');
          if (ovdTable) {
            ovdTable.classList.remove('field-invalid-mandatory');
          }
        }
      } else if (target.type === 'file') {
        isValid = Boolean(target.files && target.files.length > 0);
        if (target.id && target.id.startsWith('file-ovd-')) {
          const ovdHeader = document.getElementById('header-sec-ovd');
          if (ovdHeader) {
            ovdHeader.classList.remove('field-invalid-mandatory');
            ovdHeader.classList.remove('label-invalid-mandatory');
          }
          const ovdTable = document.querySelector('.bank-table-grid');
          if (ovdTable) {
            ovdTable.classList.remove('field-invalid-mandatory');
          }
        }
      } else if (target.id === 'step2-branch-select') {
        isValid = Boolean(target.value);
        if (isValid) {
          target.classList.remove('field-invalid-mandatory');
          target.closest('td')?.querySelector('strong')?.classList.remove('label-invalid-mandatory');
        }
      } else if (target.id === 'email-username') {
        isValid = target.value && target.value.trim().length > 0;
        if (isValid) {
          target.classList.remove('field-invalid-mandatory');
          const lbl = document.getElementById('label-email');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        }
      } else if (target.id === 'input-annual-income') {
        isValid = parseFloat(target.value || '0') > 0;
        if (isValid) {
          target.classList.remove('field-invalid-mandatory');
          const lbl = document.getElementById('label-annual-income');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        }
      } else if (target.id === 'input-addr-house') {
        isValid = Boolean(target.value && target.value.trim().length > 0);
        if (isValid) {
          target.classList.remove('field-invalid-mandatory');
          const lbl = document.getElementById('label-addr-house');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        }
      } else if (target.id === 'input-city') {
        isValid = Boolean(target.value && target.value.trim().length > 0);
        if (isValid) {
          target.classList.remove('field-invalid-mandatory');
          const lbl = document.getElementById('label-city');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        }
      } else if (target.id === 'input-state') {
        isValid = Boolean(target.value && target.value.trim().length > 0);
        if (isValid) {
          target.classList.remove('field-invalid-mandatory');
          const lbl = document.getElementById('label-state');
          if (lbl) { lbl.classList.remove('field-invalid-mandatory'); lbl.classList.remove('label-invalid-mandatory'); }
        }
      }

      if (isValid && target.classList) {
        target.classList.remove('field-invalid-mandatory');
      }
    }

    updateLiveMissingCounters();
  }

  function refreshMissingBadges() {
    updateLiveMissingCounters();
  }

  // ----------------------------------------------------------------- COMPREHENSIVE DETAILED VALIDATION ENGINE
  function getDetailedValidationReport() {
    const sections = [];
    let totalMissing = 0;
    let firstInvalidEl = null;

    function addSection(id, name, part, missingFields) {
      if (missingFields.length > 0) {
        totalMissing += missingFields.length;
        if (!firstInvalidEl && missingFields[0].el) {
          firstInvalidEl = missingFields[0].el;
        }
        sections.push({
          id,
          name,
          part,
          count: missingFields.length,
          fields: missingFields
        });
      }
    }

    // 1. Form Header & Branch Information
    const sec0Fields = [];
    const appType = document.querySelector('input[name="appTypeRadio"]:checked');
    if (!appType) sec0Fields.push({ label: 'Application Type', el: document.querySelector('input[name="appTypeRadio"]')?.closest('td'), elId: 'wrap-app-type' });

    const accCat = document.querySelector('input[name="accCategoryRadio"]:checked');
    if (!accCat) sec0Fields.push({ label: 'Account Category', el: document.querySelector('input[name="accCategoryRadio"]')?.closest('td'), elId: 'wrap-acc-cat' });

    const appDateVal = document.getElementById('raw-header-date')?.value?.trim();
    if (!appDateVal || !validateDateString(appDateVal, false).valid) {
      sec0Fields.push({ label: 'Application Date', el: document.getElementById('raw-header-date'), elId: 'raw-header-date' });
    }

    const branch = document.getElementById('step2-branch-select')?.value || document.getElementById('step1-branch-select')?.value;
    if (!branch) sec0Fields.push({ label: 'Branch Selection', el: document.getElementById('step2-branch-select'), elId: 'step2-branch-select' });

    addSection('sec-header', 'Form Header & Branch', 'part1', sec0Fields);

    // 2. Personal Details (Primary Applicant)
    const sec1Fields = [];
    const prefix = document.querySelector('input[name="namePrefix"]:checked');
    if (!prefix) sec1Fields.push({ label: 'Name Prefix', el: document.getElementById('label-name-prefix'), labelEl: document.getElementById('label-name-prefix'), elId: 'label-name-prefix' });

    const firstName = document.getElementById('raw-first-name')?.value?.trim();
    if (!firstName) sec1Fields.push({ label: 'First Name', el: document.getElementById('wrap-first-name') || document.getElementById('raw-first-name'), labelEl: document.getElementById('label-first-name'), elId: 'raw-first-name' });

    const lastName = document.getElementById('raw-last-name')?.value?.trim();
    if (!lastName) sec1Fields.push({ label: 'Last Name', el: document.getElementById('wrap-last-name') || document.getElementById('raw-last-name'), labelEl: document.getElementById('label-last-name'), elId: 'raw-last-name' });

    const fatherName = document.getElementById('raw-father-name')?.value?.trim();
    if (!fatherName) sec1Fields.push({ label: "Father's Name", el: document.getElementById('wrap-father-name') || document.getElementById('raw-father-name'), labelEl: document.getElementById('label-father-name'), elId: 'raw-father-name' });

    const motherName = document.getElementById('raw-mother-name')?.value?.trim();
    if (!motherName) sec1Fields.push({ label: "Mother's Name", el: document.getElementById('wrap-mother-name') || document.getElementById('raw-mother-name'), labelEl: document.getElementById('label-mother-name'), elId: 'raw-mother-name' });

    const dobVal = document.getElementById('raw-dob-date')?.value?.trim() || document.getElementById('raw-dob')?.value?.trim();
    if (!dobVal || !validateDateString(dobVal, true).valid) {
      sec1Fields.push({ label: 'Date of Birth (DOB)', el: document.getElementById('wrap-dob-date') || document.getElementById('raw-dob-date'), labelEl: document.getElementById('label-dob'), elId: 'raw-dob-date' });
    }

    const gender = document.querySelector('input[name="genderRadio"]:checked');
    if (!gender) sec1Fields.push({ label: 'Gender', el: document.getElementById('label-gender') || document.querySelector('input[name="genderRadio"]')?.parentElement, labelEl: document.getElementById('label-gender'), elId: 'label-gender' });

    const marital = document.querySelector('input[name="maritalRadio"]:checked');
    if (!marital) sec1Fields.push({ label: 'Marital Status', el: document.getElementById('label-marital'), labelEl: document.getElementById('label-marital'), elId: 'label-marital' });

    const nationality = document.querySelector('input[name="nationalityRadio"]:checked');
    if (!nationality) sec1Fields.push({ label: 'Nationality', el: document.getElementById('label-nationality'), labelEl: document.getElementById('label-nationality'), elId: 'label-nationality' });

    if (accCat && accCat.value === 'MINOR') {
      const guardian = document.getElementById('raw-guardian-name')?.value?.trim();
      if (!guardian) sec1Fields.push({ label: 'Guardian Name (Minor)', el: document.getElementById('raw-guardian-name')?.closest('.bank-box-wrap') || document.getElementById('raw-guardian-name'), elId: 'raw-guardian-name' });
    }

    addSection('sec-personal', 'Personal Details', 'part1', sec1Fields);

    // 3. Occupation & Financial Profile
    const sec2Fields = [];
    const empStatus = document.querySelector('input[name="empStatusRadio"]:checked');
    if (!empStatus) sec2Fields.push({ label: 'Occupation Type', el: document.getElementById('label-emp-status') || document.querySelector('input[name="empStatusRadio"]')?.parentElement, labelEl: document.getElementById('label-emp-status'), elId: 'label-emp-status' });

    const annualIncome = parseFloat(document.getElementById('input-annual-income')?.value || '0');
    if (isNaN(annualIncome) || annualIncome <= 0) {
      sec2Fields.push({ label: 'Annual Income', el: document.getElementById('input-annual-income'), labelEl: document.getElementById('label-annual-income'), elId: 'input-annual-income' });
    }

    const incomeBracket = document.querySelector('input[name="incomeBracketRadio"]:checked');
    if (!incomeBracket) sec2Fields.push({ label: 'Income Bracket', el: document.getElementById('label-income-bracket') || document.querySelector('input[name="incomeBracketRadio"]')?.parentElement, labelEl: document.getElementById('label-income-bracket'), elId: 'label-income-bracket' });

    const sourceFunds = document.querySelector('input[name="sourceFundsRadio"]:checked');
    if (!sourceFunds) sec2Fields.push({ label: 'Source of Funds', el: document.getElementById('label-source-funds') || document.querySelector('input[name="sourceFundsRadio"]')?.parentElement, labelEl: document.getElementById('label-source-funds'), elId: 'label-source-funds' });

    addSection('sec-financial', 'Occupation & Financial Profile', 'part1', sec2Fields);

    // 4. Identification & Tax Information
    const sec3Fields = [];
    const form60 = document.querySelector('input[name="form60Radio"]:checked')?.value === 'YES';
    if (!form60) {
      const panVal = document.getElementById('raw-pan-number')?.value?.trim() || document.querySelector('input[name="taxId"]')?.value?.trim();
      if (!panVal || panVal.length < 10) {
        sec3Fields.push({ label: 'PAN / Tax ID', el: document.getElementById('wrap-pan-number') || document.getElementById('raw-pan-number'), labelEl: document.getElementById('label-pan-number'), elId: 'raw-pan-number' });
      }
    }
    const aadhaarVal = document.getElementById('raw-aadhaar-number')?.value?.trim() || document.querySelector('input[name="aadhaarNumber"]')?.value?.trim();
    if (!aadhaarVal || aadhaarVal.length < 12) {
      sec3Fields.push({ label: 'Aadhaar Number', el: document.getElementById('wrap-aadhaar-number') || document.getElementById('raw-aadhaar-number'), labelEl: document.getElementById('label-aadhaar-number'), elId: 'raw-aadhaar-number' });
    }

    const disChoice = document.querySelector('input[name="disabilityRadio"]:checked')?.value;
    if (disChoice === 'YES') {
      const disDesc = document.querySelector('input[name="disabilityDesc"]')?.value?.trim();
      if (!disDesc) sec3Fields.push({ label: 'Disability Specification', el: document.querySelector('input[name="disabilityDesc"]'), elId: 'disabilityDesc' });
    }

    const pepChoice = document.querySelector('input[name="pepRadio"]:checked')?.value;
    if (pepChoice === 'PEP' || pepChoice === 'RELATED_PEP' || pepChoice === 'YES') {
      const pepCountry = document.querySelector('input[name="pepCountry"]')?.value?.trim();
      if (!pepCountry) sec3Fields.push({ label: 'PEP Associated Country', el: document.querySelector('input[name="pepCountry"]'), elId: 'pepCountry' });
    }

    addSection('sec-id-tax', 'Identification & Tax Information', 'part1', sec3Fields);

    // 5. Contact Details
    const sec4Fields = [];
    const mobile = document.getElementById('raw-mobile-number')?.value?.trim();
    if (!mobile || mobile.length < 8) {
      sec4Fields.push({ label: 'Mobile Number', el: document.getElementById('wrap-mobile-number') || document.getElementById('raw-mobile-number'), labelEl: document.getElementById('label-mobile'), elId: 'raw-mobile-number' });
    }

    const emailUser = document.getElementById('email-username')?.value?.trim();
    const emailDomain = document.getElementById('email-domain-select')?.value;
    if (!emailUser) {
      sec4Fields.push({ label: 'Email Username', el: document.getElementById('email-username'), labelEl: document.getElementById('label-email'), elId: 'email-username' });
    } else if (emailDomain === 'OTHER') {
      const customDomain = document.getElementById('inline-custom-domain-input')?.value?.trim();
      const validDomain = /^[a-zA-Z0-9][a-zA-Z0-9\-\.]*\.[a-zA-Z]{2,}$/.test(customDomain || '');
      if (!validDomain) {
        sec4Fields.push({ label: 'Valid Custom Email Domain', el: document.getElementById('inline-custom-domain-input'), labelEl: document.getElementById('label-email'), elId: 'inline-custom-domain-input' });
      }
    }

    addSection('sec-contact', 'Contact Details', 'part1', sec4Fields);

    // 6. Proof of Identity & Address (OVD)
    const secOvdFields = [];
    const checkedOvd = document.querySelectorAll('input[name="ovdSelectChk"]:checked');
    let hasValidOvd = false;

    // Check all checked OVD rows for either a file upload, text value, or valid Aadhaar
    checkedOvd.forEach(chk => {
      const row = chk.closest('tr');
      if (row) {
        // 1. File input has an attached file
        const fileInp = row.querySelector('input[type="file"]');
        if (fileInp && fileInp.files && fileInp.files.length > 0) {
          hasValidOvd = true;
        }

        // 2. Status span displays an uploaded file (e.g. "✓ filename.pdf")
        const statusSpan = row.querySelector('span[id^="ovd-status-"]');
        const spanTxt = statusSpan ? statusSpan.textContent.trim() : '';
        if (spanTxt && spanTxt !== 'No file' && !spanTxt.includes('No file')) {
          hasValidOvd = true;
        }

        // 3. Document / Reference number entered in this row
        const textInps = row.querySelectorAll('input[type="text"]');
        textInps.forEach(inp => {
          if (inp.value && inp.value.trim().length > 0) {
            hasValidOvd = true;
          }
        });
      }

      // 4. Aadhaar row valid if 12-digit Aadhaar was filled in Section 3
      if (chk.value === 'AADHAAR') {
        const aVal = document.getElementById('raw-aadhaar-number')?.value?.trim();
        if (aVal && aVal.length >= 12) {
          hasValidOvd = true;
        }
      }
    });

    // Also check if ANY OVD certified copy file was uploaded across the whole table
    if (!hasValidOvd) {
      const allOvdFileSpans = document.querySelectorAll('span[id^="ovd-status-"]');
      for (const sp of allOvdFileSpans) {
        const txt = sp.textContent ? sp.textContent.trim() : '';
        if (txt && txt !== 'No file' && !txt.includes('No file')) {
          hasValidOvd = true;
          break;
        }
      }
    }

    if (!hasValidOvd) {
      const allOvdFileInputs = document.querySelectorAll('input[type="file"][id^="file-ovd-"]');
      for (const fi of allOvdFileInputs) {
        if (fi.files && fi.files.length > 0) {
          hasValidOvd = true;
          break;
        }
      }
    }

    if (!hasValidOvd) {
      secOvdFields.push({ label: 'Officially Valid Document (OVD)', el: document.getElementById('header-sec-ovd'), elId: 'header-sec-ovd' });
    } else {
      const ovdHeader = document.getElementById('header-sec-ovd');
      if (ovdHeader) {
        ovdHeader.classList.remove('field-invalid-mandatory');
        ovdHeader.classList.remove('label-invalid-mandatory');
      }
      const ovdTable = document.querySelector('.bank-table-grid');
      if (ovdTable) {
        ovdTable.classList.remove('field-invalid-mandatory');
      }
    }
    addSection('sec-ovd', 'Proof of Identity / Address (OVD)', 'part1-cont', secOvdFields);

    // 7. Address Details
    const secAddrFields = [];
    const addrHouse = document.getElementById('input-addr-house')?.value?.trim();
    if (!addrHouse) secAddrFields.push({ label: 'House / Street Address', el: document.getElementById('input-addr-house'), labelEl: document.getElementById('label-addr-house'), elId: 'input-addr-house' });

    const addrCity = document.getElementById('input-city')?.value?.trim();
    if (!addrCity) secAddrFields.push({ label: 'City', el: document.getElementById('input-city'), labelEl: document.getElementById('label-city'), elId: 'input-city' });

    const addrState = document.getElementById('input-state')?.value?.trim();
    if (!addrState) secAddrFields.push({ label: 'State', el: document.getElementById('input-state'), labelEl: document.getElementById('label-state'), elId: 'input-state' });

    const pincode = document.getElementById('raw-pincode')?.value?.trim() || document.querySelector('input[name="postalCode"]')?.value?.trim();
    if (!pincode || pincode.length !== 6) secAddrFields.push({ label: '6-Digit PIN Code', el: document.getElementById('wrap-pincode') || document.getElementById('raw-pincode'), labelEl: document.getElementById('label-pincode'), elId: 'raw-pincode' });

    addSection('sec-address', 'Address Details', 'part1-cont', secAddrFields);

    // 8. Photo & Verification Specimen
    const secPhotoFields = [];
    const photo = document.getElementById('input-applicant-photo-data')?.value?.trim() || document.getElementById('applicant-photo-preview')?.getAttribute('src');
    if (!photo || photo === '#' || photo.includes('placeholder')) {
      secPhotoFields.push({ label: 'Applicant Photograph', el: document.getElementById('slot-applicant-photo') || document.getElementById('photo-sig-pair-applicant-1'), elId: 'applicant-photo-file-input' });
    }

    const sig = document.getElementById('input-applicant-signature-data')?.value?.trim();
    const thumb = document.getElementById('input-applicant-thumb-data')?.value?.trim();
    if (!sig && !thumb) {
      secPhotoFields.push({ label: 'Specimen Signature / Thumb', el: document.getElementById('slot-applicant-signature'), elId: 'slot-applicant-signature' });
    }
    addSection('sec-photo-sig', 'Photograph & Verification Specimen', 'part1-cont', secPhotoFields);

    // 9. Account Type & Deposit
    const secAccFields = [];
    const accTypeVal = window.selectedAccountType || document.getElementById('apply-selected-account-type')?.value;
    if (!accTypeVal) secAccFields.push({ label: 'Account Scheme', el: document.getElementById('apply-selected-account-type'), elId: 'apply-selected-account-type' });

    const deposit = document.getElementById('input-initial-deposit')?.value?.trim();
    if (deposit === '' || isNaN(parseFloat(deposit))) {
      secAccFields.push({ label: 'Initial Deposit Amount', el: document.getElementById('input-initial-deposit'), elId: 'input-initial-deposit' });
    }

    const password = document.getElementById('input-password')?.value?.trim();
    if (!password || password.length < 8) {
      secAccFields.push({ label: 'Online Banking Password (Min 8 Chars)', el: document.getElementById('input-password'), elId: 'input-password' });
    }
    addSection('sec-account', 'Account Scheme & Deposit', 'part2', secAccFields);

    // 10. Nomination Details
    const secNomFields = [];
    const nomChoice = document.querySelector('input[name="nominationChoiceRadio"]:checked')?.value || 'REGISTER';
    if (nomChoice === 'REGISTER') {
      const nomName = document.getElementById('raw-nominee-name')?.value?.trim();
      if (!nomName) {
        secNomFields.push({ label: 'Nominee Name', el: document.getElementById('wrap-nominee-name') || document.getElementById('raw-nominee-name'), labelEl: document.getElementById('label-nominee-name'), elId: 'raw-nominee-name' });
      }
    }
    addSection('sec-nomination', 'Nomination Details', 'part3', secNomFields);

    // 11. FATCA Declaration
    const secFatcaFields = [];
    const fatca = document.querySelector('input[name="fatcaRadio"]:checked');
    if (!fatca) secFatcaFields.push({ label: 'FATCA Tax Residency Declaration', el: document.getElementById('header-sec-fatca'), elId: 'header-sec-fatca' });
    addSection('sec-fatca', 'FATCA Declaration', 'part3', secFatcaFields);

    // 12. Final Declaration Specimen
    const secDeclFields = [];
    const part3Sig = document.getElementById('part3-sig1-preview')?.getAttribute('data-signed') === 'true' ||
                     document.getElementById('input-applicant-signature-data')?.value?.trim() ||
                     document.getElementById('input-applicant-thumb-data')?.value?.trim();
    if (!part3Sig) {
      secDeclFields.push({ label: 'Final Applicant Declaration Signature', el: document.getElementById('part3-sig1-preview'), elId: 'part3-sig1-preview' });
    }
    addSection('sec-declaration', 'Declarations & Specimen Signatures', 'part3', secDeclFields);

    // 13. Additional / Secondary Applicants (for Joint Accounts)
    if (accTypeVal === 'JOINT') {
      const jointCount = parseInt(document.getElementById('input-joint-members-count')?.value || '2', 10);
      for (let i = 2; i <= jointCount; i++) {
        const secJointFields = [];
        const jRel = document.getElementById(`select-joint${i}-relationship`)?.value?.trim() ||
                     document.querySelector(`select[name="joint${i}Relationship"]`)?.value?.trim();
        if (!jRel) {
          secJointFields.push({ label: 'Relationship with Primary*', el: document.getElementById(`select-joint${i}-relationship`), elId: `select-joint${i}-relationship` });
        }

        const jFirst = document.getElementById(`raw-joint${i}-first-name`)?.value?.trim() ||
                       document.querySelector(`input[name="joint${i}FirstName"]`)?.value?.trim();
        if (!jFirst) {
          secJointFields.push({ label: 'First Name', el: document.getElementById(`raw-joint${i}-first-name`), elId: `raw-joint${i}-first-name` });
        }

        const jLast = document.getElementById(`raw-joint${i}-last-name`)?.value?.trim() ||
                      document.querySelector(`input[name="joint${i}LastName"]`)?.value?.trim();
        if (!jLast) {
          secJointFields.push({ label: 'Last Name', el: document.getElementById(`raw-joint${i}-last-name`), elId: `raw-joint${i}-last-name` });
        }

        const jDob = document.getElementById(`raw-joint${i}-dob`)?.value?.trim() ||
                     document.getElementById(`input-joint${i}-dob`)?.value?.trim() ||
                     document.querySelector(`input[name="joint${i}Dob"]`)?.value?.trim();
        if (!jDob || !validateDateString(jDob, false).valid) {
          secJointFields.push({ label: 'DOB (DD/MM/YYYY)', el: document.getElementById(`raw-joint${i}-dob`) || document.getElementById(`input-joint${i}-dob`), elId: `raw-joint${i}-dob` });
        }

        const jPan = document.getElementById(`raw-joint${i}-pan-number`)?.value?.trim() ||
                     document.querySelector(`input[name="joint${i}Pan"]`)?.value?.trim();
        if (!jPan || jPan.length < 10) {
          secJointFields.push({ label: 'PAN Number', el: document.getElementById(`raw-joint${i}-pan-number`), elId: `raw-joint${i}-pan-number` });
        }

        const jPhone = document.getElementById(`raw-joint${i}-mobile-number`)?.value?.trim() ||
                       document.querySelector(`input[name="joint${i}Phone"]`)?.value?.trim();
        if (!jPhone || jPhone.length < 8) {
          secJointFields.push({ label: 'Mobile Number', el: document.getElementById(`raw-joint${i}-mobile-number`), elId: `raw-joint${i}-mobile-number` });
        }

        const jPhoto = document.getElementById(`input-joint${i}-photo-data`)?.value?.trim();
        if (!jPhoto) {
          secJointFields.push({ label: 'Photograph', el: document.getElementById(`joint${i}-photo-box`), elId: `joint${i}-photo-box` });
        }

        const jSig = document.getElementById(`input-joint${i}-signature-data`)?.value?.trim() ||
                     document.getElementById(`input-joint${i}-thumb-data`)?.value?.trim();
        if (!jSig) {
          secJointFields.push({ label: 'Specimen Signature / Thumb', el: document.getElementById(`slot-joint${i}-signature`) || document.getElementById(`joint${i}-signature-slot`), elId: `slot-joint${i}-signature` });
        }

        const suffix = (i === 2) ? '2nd' : (i === 3) ? '3rd' : `${i}th`;
        addSection(`sec-joint-${i}`, `${suffix} Applicant (Co-Applicant #${i})`, 'part1', secJointFields);
      }
    }

    return {
      isValid: totalMissing === 0,
      totalMissing,
      sections,
      firstInvalidEl
    };
  }

  // ----------------------------------------------------------------- GLASSMORPHIC TOOLTIP CONTROLLER
  function updateGlassmorphicValidationIndicator(report = null) {
    if (!report) {
      report = getDetailedValidationReport();
    }

    const indicator = document.getElementById('validation-summary-indicator');
    if (!indicator) return;

    if (report.isValid) {
      indicator.style.display = 'none';
      return;
    }

    indicator.style.display = 'inline-flex';

    // Summary badge text & count
    const badgeTextEl = document.getElementById('val-summary-text');
    const badgeCountEl = document.getElementById('val-summary-count-badge');
    const totalCountEl = document.getElementById('val-glass-total-count');
    const sectionsListEl = document.getElementById('val-glass-sections-list');

    if (badgeCountEl) badgeCountEl.textContent = String(report.totalMissing);

    if (badgeTextEl) {
      if (report.sections.length === 1) {
        badgeTextEl.textContent = `${report.totalMissing} missing field${report.totalMissing > 1 ? 's' : ''} in ${report.sections[0].name}`;
      } else {
        const topSection = report.sections[0];
        badgeTextEl.textContent = `${report.totalMissing} missing fields (${topSection.count} in ${topSection.name})`;
      }
    }

    if (totalCountEl) {
      totalCountEl.textContent = `${report.totalMissing} mandatory field(s) require completion across ${report.sections.length} category section(s)`;
    }

    if (sectionsListEl) {
      sectionsListEl.innerHTML = report.sections.map(sec => `
        <div class="val-glass-section-item">
          <div class="val-glass-section-title">
            <span>📍 ${esc(sec.name)}</span>
            <span class="val-glass-section-count">${esc(sec.count)} missing</span>
          </div>
          <div class="val-glass-fields-chips">
            ${sec.fields.map(f => `
              <button type="button" class="val-glass-field-chip" onclick="window.focusValidationField('${esc(f.elId)}', '${esc(sec.part)}')" title="Click to jump to ${esc(f.label)}">
                <span>• ${esc(f.label)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  function focusValidationField(targetId, targetPart = 'part1') {
    if (typeof window.switchFormPart === 'function' && targetPart) {
      window.switchFormPart(targetPart);
    }

    setTimeout(() => {
      const el = document.getElementById(targetId) || document.querySelector(`[name="${targetId}"]`);
      if (el) {
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (typeof el.focus === 'function') {
          el.focus();
        }
        const wrap = el.closest ? (el.closest('.bank-box-wrap') || el.closest('.char-input-group') || el) : el;
        if (wrap) {
          wrap.classList.add('field-invalid-mandatory');
          setTimeout(() => wrap.classList.remove('field-invalid-mandatory'), 3500);
        }
      }
    }, 150);
  }

  // ----------------------------------------------------------------- COMPREHENSIVE FORM VALIDATION FOR SUBMIT
  function validateCustomerFormFields(shouldScroll = true) {
    document.querySelectorAll('.field-invalid-mandatory').forEach(el => el.classList.remove('field-invalid-mandatory'));
    document.querySelectorAll('.cell-invalid').forEach(el => el.classList.remove('cell-invalid'));
    document.querySelectorAll('.label-invalid-mandatory').forEach(el => el.classList.remove('label-invalid-mandatory'));

    const report = getDetailedValidationReport();

    // Mark invalid DOM elements
    report.sections.forEach(sec => {
      sec.fields.forEach(f => {
        if (!f.el) return;

        // If f.el is an input inside bank-box-wrap or is bank-box-wrap
        const boxWrap = f.el.classList.contains('bank-box-wrap')
          ? f.el
          : (f.el.closest ? f.el.closest('.bank-box-wrap') : null);

        if (boxWrap) {
          boxWrap.classList.add('field-invalid-mandatory');
          boxWrap.querySelectorAll('.char-cell').forEach(c => c.classList.add('cell-invalid'));
        } else {
          f.el.classList.add('field-invalid-mandatory');
        }

        // Highlight associated label
        const targetLabel = f.labelEl ||
          (boxWrap ? (boxWrap.closest('.char-input-group')?.querySelector('.char-input-label-row span:first-child') || boxWrap.parentElement?.querySelector('label')) : null) ||
          (f.el.tagName === 'LABEL' || f.el.tagName === 'SPAN' ? f.el : null) ||
          f.el.closest('div')?.querySelector('label') ||
          f.el.parentElement?.querySelector('label') ||
          f.el.closest('td')?.querySelector('strong');

        if (targetLabel) {
          targetLabel.classList.add('label-invalid-mandatory');
        }
      });
    });

    updateGlassmorphicValidationIndicator(report);
    updateLiveMissingCounters();

    if (!report.isValid) {
      if (shouldScroll && report.firstInvalidEl) {
        const firstSec = report.sections[0];
        if (firstSec && typeof window.switchFormPart === 'function') {
          window.switchFormPart(firstSec.part);
        }
        setTimeout(() => {
          if (typeof report.firstInvalidEl.scrollIntoView === 'function') {
            report.firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          if (typeof report.firstInvalidEl.focus === 'function') {
            report.firstInvalidEl.focus();
          }
        }, 150);
      }
      return false;
    }

    // If valid, hide banner
    const banner = document.getElementById('validation-summary-banner');
    if (banner) banner.style.display = 'none';

    return true;
  }

  // ----------------------------------------------------------------- TOP-OF-FORM STRUCTURED SUMMARY BANNER (SUPPRESSED IN FAVOR OF TAB HOVER TOOLTIPS)
  function renderValidationSummaryBanner(report = null) {
    const banner = document.getElementById('validation-summary-banner');
    if (banner) {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }

  // Export module APIs
  window.validateDateString = validateDateString;
  window.clearErrorOnValidInput = clearErrorOnValidInput;
  window.refreshMissingBadges = refreshMissingBadges;
  window.calculateSectionMissingCounts = calculateSectionMissingCounts;
  window.updateLiveMissingCounters = updateLiveMissingCounters;
  window.validateCustomerFormFields = validateCustomerFormFields;
  window.getDetailedValidationReport = getDetailedValidationReport;
  window.updateGlassmorphicValidationIndicator = updateGlassmorphicValidationIndicator;
  window.renderValidationSummaryBanner = renderValidationSummaryBanner;
  window.focusValidationField = focusValidationField;

})(typeof window !== 'undefined' ? window : this);
