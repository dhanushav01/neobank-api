/**
 * Customer Account Opening & Onboarding Wizard (Steps 1, 2, 3, 4)
 * Handles account selection, eligibility check, dynamic field adaptation,
 * multi-step application submission, and encrypted document uploads.
 */

// Centralized Utilities from utils.js & api.js
var formatHumanText = (window.NeoBankUtils && window.NeoBankUtils.formatHumanText) || window.formatHumanText || function(val) { return val || ''; };
var showToast = window.showToast || function(msg, type) { console.log(`[Toast ${type || 'info'}]:`, msg); };

let selectedAccountType = 'SAVINGS';
let currentApplicationNumber = null;
let currentDraftSecret = (function() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('draftSecret') || params.get('secret') || '';
  } catch (_) { return ''; }
})();
window.currentDraftSecret = currentDraftSecret;

// Branch directory with codes
const BRANCH_DIRECTORY = {
  'Downtown Main Branch': { code: 'BR001' },
  'Central Digital Branch': { code: 'NBK-001' },
  'Mumbai Main Branch': { code: 'BOM-001' },
  'Delhi Connaught Place Branch': { code: 'DEL-002' },
  'Bengaluru Tech Park Branch': { code: 'BLR-003' },
  'Hyderabad Cyber City Branch': { code: 'HYD-004' },
  'Chennai Central Branch': { code: 'MAA-005' },
  'Kolkata Park Street Branch': { code: 'CCU-006' },
  'Pune Shivaji Nagar Branch': { code: 'PNQ-007' },
  'Ahmedabad Ashram Road Branch': { code: 'AMD-008' }
};

// PIN Code <-> City / District / State bidirectional lookup table
const PIN_DIRECTORY = [
  { pinPrefix: '400', pin: '400001', city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra' },
  { pinPrefix: '411', pin: '411001', city: 'Pune', district: 'Pune', state: 'Maharashtra' },
  { pinPrefix: '440', pin: '440001', city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra' },
  { pinPrefix: '110', pin: '110001', city: 'New Delhi', district: 'Central Delhi', state: 'Delhi' },
  { pinPrefix: '560', pin: '560001', city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
  { pinPrefix: '600', pin: '600001', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu' },
  { pinPrefix: '641', pin: '641001', city: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu' },
  { pinPrefix: '700', pin: '700001', city: 'Kolkata', district: 'Kolkata', state: 'West Bengal' },
  { pinPrefix: '500', pin: '500001', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana' },
  { pinPrefix: '380', pin: '380001', city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat' },
  { pinPrefix: '395', pin: '395001', city: 'Surat', district: 'Surat', state: 'Gujarat' },
  { pinPrefix: '302', pin: '302001', city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan' },
  { pinPrefix: '226', pin: '226001', city: 'Lucknow', district: 'Lucknow', state: 'Uttar Pradesh' },
  { pinPrefix: '160', pin: '160001', city: 'Chandigarh', district: 'Chandigarh', state: 'Punjab' },
  { pinPrefix: '682', pin: '682001', city: 'Kochi', district: 'Ernakulam', state: 'Kerala' },
  { pinPrefix: '800', pin: '800001', city: 'Patna', district: 'Patna', state: 'Bihar' },
  { pinPrefix: '462', pin: '462001', city: 'Bhopal', district: 'Bhopal', state: 'Madhya Pradesh' },
  { pinPrefix: '452', pin: '452001', city: 'Indore', district: 'Indore', state: 'Madhya Pradesh' },
  { pinPrefix: '751', pin: '751001', city: 'Bhubaneswar', district: 'Khurda', state: 'Odisha' },
  { pinPrefix: '781', pin: '781001', city: 'Guwahati', district: 'Kamrup Metropolitan', state: 'Assam' },
  { pinPrefix: '530', pin: '530001', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { pinPrefix: '141', pin: '141001', city: 'Ludhiana', district: 'Ludhiana', state: 'Punjab' },
  { pinPrefix: '122', pin: '122001', city: 'Gurugram', district: 'Gurugram', state: 'Haryana' },
  { pinPrefix: '201', pin: '201301', city: 'Noida', district: 'Gautam Buddha Nagar', state: 'Uttar Pradesh' }
];

function copyCurrentAppNumber() {
  if (!currentApplicationNumber) {
    showToast('No Application Number generated yet', 'info');
    return;
  }
  navigator.clipboard.writeText(currentApplicationNumber).then(() => {
    showToast(`Application Number ${currentApplicationNumber} copied to clipboard!`, 'success');
  }).catch(() => {
    showToast(`Application Number: ${currentApplicationNumber}`, 'info');
  });
}

async function initiateAndProceedToStep2() {
  const agreed = document.getElementById('chk-eligibility-agreed');
  if (agreed && !agreed.checked) {
    showToast('Please confirm that you meet the bank eligibility requirements.', 'error');
    return;
  }

  const s1Select = document.getElementById('step1-branch-select');
  if (!s1Select || !s1Select.value) {
    showToast('Please select your preferred Home Branch.', 'error');
    if (s1Select) s1Select.focus();
    return;
  }

  const branchName = s1Select.value;
  const branchCode = document.getElementById('step1-branch-code')?.value || (BRANCH_DIRECTORY[branchName] ? BRANCH_DIRECTORY[branchName].code : '');

  try {
    const res = await api('/onboarding/initiate-draft', {
      method: 'POST',
      body: {
        accountType: selectedAccountType,
        branchName: branchName,
        branchCode: branchCode
      }
    });

    if (!res || !res.applicationNumber) {
      throw new Error('Failed to initiate application reference');
    }

    currentApplicationNumber = res.applicationNumber;
    currentDraftSecret = res.draftSecret || '';
    window.currentApplicationNumber = currentApplicationNumber;
    window.currentDraftSecret = currentDraftSecret;
    try { sessionStorage.setItem('draft_secret_' + currentApplicationNumber, currentDraftSecret); } catch (_) {}

    // Update URL without page reload
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', `/open_account_customer/${currentApplicationNumber}`);
    }

    // Update toolbar & form header badges
    const toolbarApp = document.getElementById('toolbar-app-number');
    if (toolbarApp) toolbarApp.textContent = currentApplicationNumber;
    const headerApp = document.getElementById('header-app-number-display');
    if (headerApp) headerApp.textContent = currentApplicationNumber;

    // Sync branch to Step 2
    syncBranchSelection(branchName);

    // Adapt fields & update demanded docs checklist
    adaptFieldsForAccountType(selectedAccountType);
    updateDemandedDocsChecklist(selectedAccountType);

    // Save initial draft
    saveCustomerFormDraft(false);

    // Suppress validation warnings upon initial draft / application number generation
    window.hasAttemptedSubmit = false;
    if (typeof updateLiveMissingCounters === 'function') {
      updateLiveMissingCounters();
    }
    const valBanner = document.getElementById('validation-summary-banner');
    if (valBanner) valBanner.style.display = 'none';

    // Advance to Step 2
    goToOnboardingStep(2);
    showToast(`Application ${currentApplicationNumber} initiated! Please fill the form below.`, 'success');

  } catch (err) {
    console.error('Error initiating draft:', err);
    showToast(err.message || 'Error generating application reference', 'error');
  }
}

async function detectAndLoadApplicationFromUrl() {
  let appNum = null;

  // 1. Check path: /open_account_customer/APP-XXXX-XXXX or /open-account/APP-XXXX-XXXX
  const path = window.location.pathname;
  const match = path.match(/\/(?:open_account_customer|open-account)\/([^\/?#]+)/i);
  if (match && match[1]) {
    let raw = decodeURIComponent(match[1]).trim().replace(/^app=/i, '').replace(/^id=/i, '');
    if (raw) appNum = raw.toUpperCase();
  }

  // 2. Check query param: ?app=APP-XXXX or ?applicationNumber=APP-XXXX or ?app_id=APP-XXXX
  if (!appNum) {
    const params = new URLSearchParams(window.location.search);
    let pVal = params.get('app') || params.get('applicationNumber') || params.get('app_id') || params.get('app_no') || params.get('id') || params.get('appNumber');
    if (pVal) appNum = pVal.trim().replace(/^app=/i, '').toUpperCase();
  }

  if (appNum) {
    currentApplicationNumber = appNum;
    const toolbarApp = document.getElementById('toolbar-app-number');
    if (toolbarApp) toolbarApp.textContent = currentApplicationNumber;
    const headerApp = document.getElementById('header-app-number-display');
    if (headerApp) headerApp.textContent = currentApplicationNumber;
    const hiddenApp = document.getElementById('hidden-application-number');
    if (hiddenApp) hiddenApp.value = currentApplicationNumber;

    // Automatically check eligibility checkbox since applicant already initiated or saved this draft
    const agreed = document.getElementById('chk-eligibility-agreed');
    if (agreed) agreed.checked = true;

    // Load draft data into uniform form
    await loadCustomerFormDraft(currentApplicationNumber);
    updateDemandedDocsChecklist(selectedAccountType);

    // Open Step 2 (Customer Information & Application Form)
    goToOnboardingStep(2);

    // Smoothly scroll down so user immediately lands on their application form
    setTimeout(() => {
      const step2 = document.getElementById('onboarding-step-2');
      if (step2) {
        step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);

    showToast(`Resumed draft for Application ${currentApplicationNumber}`, 'info');
    return true;
  }
  return false;
}

// Default catalog loaded instantly to prevent empty state or lag
// Default catalog loaded instantly to prevent empty state or lag
const DEFAULT_CATALOG = [
  // 1. Everyday / Transactional
  {
    type: "SAVINGS",
    category: "Everyday / Transactional",
    title: "High-Yield Savings Account",
    tagline: "Grow your wealth with competitive daily-accrued interest.",
    interestRate: "4.20% APY",
    minAge: 18,
    minInitialDeposit: 100.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Must be at least 18 years old",
      "Initial deposit of at least $100.00 required upon approval",
      "Legal resident of supported jurisdiction"
    ],
    requiredDocuments: [
      { name: "Proof of Identity", examples: "Passport, National ID Card, or Driver's License" },
      { name: "Proof of Address", examples: "Utility bill or Bank statement (less than 3 months old)" },
      { name: "Tax Identification", examples: "SSN (US), National Insurance (UK), or PAN (India)" }
    ]
  },
  {
    type: "CHECKING",
    category: "Everyday / Transactional",
    title: "Everyday Current & Checking Account",
    tagline: "Full-featured digital checking with contactless Visa debit and overdraft protection.",
    interestRate: "0.10% APY",
    minAge: 18,
    minInitialDeposit: 25.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Must be at least 18 years old",
      "Overdraft protection eligibility subject to credit assessment",
      "Free international contactless debit card included"
    ],
    requiredDocuments: [
      { name: "Proof of Identity", examples: "Passport or Driver's License" },
      { name: "Proof of Address", examples: "Utility bill or Council Tax statement" },
      { name: "Tax Identification", examples: "SSN or PAN card" }
    ]
  },
  {
    type: "SALARY",
    category: "Everyday / Transactional",
    title: "Corporate Salary Account",
    tagline: "Zero-minimum-balance corporate salary account with zero-fee ATM withdrawals.",
    interestRate: "2.50% APY",
    minAge: 18,
    minInitialDeposit: 0.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Must be actively employed or corporate professional",
      "Zero minimum balance requirement",
      "Monthly recurring payroll credit required"
    ],
    requiredDocuments: [
      { name: "Proof of Identity", examples: "Passport or National ID" },
      { name: "Employment Proof", examples: "Recent salary payslip, Offer letter, or Corporate ID" },
      { name: "Tax Identification", examples: "SSN or Tax ID number" }
    ]
  },
  // 2. Long-Term / Investment
  {
    type: "FIXED_DEPOSIT",
    category: "Long-Term / Investment",
    title: "Fixed / Term Deposit Account",
    tagline: "Guaranteed locked-in premium returns with flexible tenure options (6 to 60 months).",
    interestRate: "5.25% APY",
    minAge: 18,
    minInitialDeposit: 500.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Must be at least 18 years old",
      "Minimum initial principal lock-in of $500.00",
      "Guaranteed penalty-free interest compounding at maturity"
    ],
    requiredDocuments: [
      { name: "Proof of Identity", examples: "Passport, National ID, or Driver's License" },
      { name: "Proof of Address", examples: "Recent Utility Bill or Tax Document" },
      { name: "Source of Funds Declaration", examples: "Bank statement verifying deposit origin" }
    ]
  },
  {
    type: "MONEY_MARKET",
    category: "Long-Term / Investment",
    title: "Money Market / Recurring Deposit",
    tagline: "Earn high-tier money-market returns with monthly scheduled auto-contributions.",
    interestRate: "3.80% APY",
    minAge: 18,
    minInitialDeposit: 50.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Must be at least 18 years old",
      "Minimum initial deposit of $50.00 with recurring schedule",
      "Higher liquidity with tiered interest"
    ],
    requiredDocuments: [
      { name: "Proof of Identity", examples: "Passport or National ID" },
      { name: "Proof of Address", examples: "Utility bill or bank statement" },
      { name: "Tax ID", examples: "SSN or Government Tax ID" }
    ]
  },
  // 3. Specialized / Cross-Border
  {
    type: "NRI_EXPAT",
    category: "Specialized / Cross-Border",
    title: "NRI / Foreign Expat Global Account",
    tagline: "Borderless multi-currency accounts (USD, EUR, GBP, AED, INR) with zero foreign remittance markup.",
    interestRate: "3.50% APY",
    minAge: 18,
    minInitialDeposit: 5000.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Expatriate, non-resident citizen, or global remote worker",
      "Zero conversion fee on cross-border inward remittances",
      "Access to multi-currency sub-ledgers"
    ],
    requiredDocuments: [
      { name: "Passport & Visa / Residence Permit", examples: "Valid foreign work visa or expat resident permit" },
      { name: "Overseas Address Proof", examples: "Utility bill or lease in foreign host country" },
      { name: "Tax Residency Declaration", examples: "W-8BEN or CRS self-certification form" }
    ]
  },
  {
    type: "STUDENT",
    category: "Specialized / Cross-Border",
    title: "Campus Student Advantage Account",
    tagline: "Tailored for higher education students with zero maintenance fees and student rewards.",
    interestRate: "1.75% APY",
    minAge: 16,
    maxAge: 26,
    minInitialDeposit: 0.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Age strictly between 16 and 26 years",
      "Enrolled in accredited secondary or university program",
      "Zero fees and free student virtual card"
    ],
    requiredDocuments: [
      { name: "Proof of Identity", examples: "Passport or National ID" },
      { name: "Student Proof", examples: "Student ID card or University Acceptance Letter" },
      { name: "Proof of Address", examples: "Dormitory registration or Parent utility bill" }
    ]
  },
  {
    type: "PENSION",
    category: "Specialized / Senior / Welfare",
    title: "Pension Savings Account",
    tagline: "Dedicated welfare and retirement account for senior citizens (60+) and disability pension beneficiaries with ₹0 min balance.",
    interestRate: "4.50% APY",
    minAge: 18,
    minInitialDeposit: 0.0,
    monthlyFee: 0.0,
    eligibilityRules: [
      "Senior citizens aged 60+ or verified disability / welfare pension recipients (18+)",
      "Direct Pension Payment Order (PPO) or Social Security disbursement credit",
      "Zero minimum balance charges and priority doorstep branch assistance"
    ],
    requiredDocuments: [
      { name: "Proof of Identity & Age", examples: "Aadhaar Card, Passport, or Senior Citizen Card" },
      { name: "Pension Sanction Order / Disability Certificate", examples: "PPO letter, EPFO Pension certificate, or Disability ID (UDID)" },
      { name: "Proof of Address", examples: "Utility bill or Voter ID" }
    ]
  }
];

let accountTypesCatalog = [...DEFAULT_CATALOG];

// Load account catalog on initialization
async function loadAccountCatalog() {
  try {
    const catalog = await api('/onboarding/account-types');
    if (Array.isArray(catalog) && catalog.length > 0) {
      accountTypesCatalog = catalog;
    }
  } catch (err) {
    console.warn('Using default account catalog:', err);
  } finally {
    selectAccountType(selectedAccountType);
  }
}

// User selects an account type
function selectAccountType(type) {
  selectedAccountType = type;

  // Highlight the selected card and unhighlight others
  document.querySelectorAll('.account-select-card').forEach(card => {
    const cardType = card.getAttribute('data-account-type');
    const isSelected = (cardType === type);
    if (isSelected) {
      card.classList.add('selected');
      card.style.borderColor = 'var(--brand-500)';
      const circle = card.querySelector('.account-radio-circle');
      if (circle) {
        circle.style.borderColor = 'var(--brand-500)';
        circle.style.background = 'var(--brand-500)';
        circle.style.color = 'var(--text-contrast)';
      }
      const text = card.querySelector('.account-radio-text');
      if (text) {
        text.textContent = 'Selected Account';
        text.style.color = 'var(--brand-500)';
      }
    } else {
      card.classList.remove('selected');
      card.style.borderColor = 'var(--border-subtle)';
      const circle = card.querySelector('.account-radio-circle');
      if (circle) {
        circle.style.borderColor = 'var(--text-muted)';
        circle.style.background = 'transparent';
        circle.style.color = 'transparent';
      }
      const text = card.querySelector('.account-radio-text');
      if (text) {
        text.textContent = 'Click to Select This Account';
        text.style.color = 'var(--text-secondary)';
      }
    }
  });

  // Update hidden form input, quick dropdown, and Step 2 summary badge
  const inputEl = document.getElementById('apply-selected-account-type');
  if (inputEl) inputEl.value = type;

  const quickSelect = document.getElementById('quick-account-type-select');
  if (quickSelect && quickSelect.value !== type) quickSelect.value = type;

  const badgeEl = document.getElementById('step2-selected-account-badge');
  if (badgeEl) badgeEl.textContent = formatHumanText(type);

  // Linkage for Item 8 & Item 9:
  // If Joint Account is chosen, auto-select Savings Bank Account in Part II Section 1 and Jointly Operated in Section 2
  const p2Radios = document.querySelectorAll('input[name="part2AccountTypeRadio"]');
  const modeRadios = document.querySelectorAll('input[name="modeOperationRadio"]');

  if (type === 'JOINT') {
    // Select Savings in Part II Section 1
    p2Radios.forEach(r => { r.checked = (r.value === 'SAVINGS'); });
    // Select Jointly Operated in Part II Section 2
    modeRadios.forEach(r => { r.checked = (r.value === 'JOINTLY'); });
    updateJointApplicantVisibility();
  } else if (type === 'PENSION') {
    p2Radios.forEach(r => { r.checked = (r.value === 'PENSION' || r.value === 'SAVINGS'); });
    modeRadios.forEach(r => { r.checked = (r.value === 'SELF_SINGLE'); });
    updateJointApplicantVisibility();
  } else {
    // For other types, sync matching Part II radio
    let matched = false;
    p2Radios.forEach(r => {
      if (r.value === type) {
        r.checked = true;
        matched = true;
      }
    });
    if (!matched) {
      p2Radios.forEach(r => { r.checked = (r.value === 'SAVINGS'); });
    }
    updateJointApplicantVisibility();
  }

  adaptFieldsForAccountType(type);
}

// Block direct alteration in Part II and prompt user to change at Step 1 (Item 8)
function preventPart2AccountChange(event, radio) {
  event.preventDefault();
  event.stopPropagation();
  showToast('To change the Account Type, please select it in Step 1 (Choose Your Account).', 'warning');
  syncPart2AccountRadio();
  return false;
}

function syncPart2AccountRadio() {
  const p2Radios = document.querySelectorAll('input[name="part2AccountTypeRadio"]');
  if (selectedAccountType === 'JOINT') {
    p2Radios.forEach(r => { r.checked = (r.value === 'SAVINGS'); });
  } else if (selectedAccountType === 'PENSION') {
    p2Radios.forEach(r => { r.checked = (r.value === 'PENSION' || r.value === 'SAVINGS'); });
  } else {
    let matched = false;
    p2Radios.forEach(r => {
      if (r.value === selectedAccountType) {
        r.checked = true;
        matched = true;
      }
    });
    if (!matched) {
      p2Radios.forEach(r => { r.checked = (r.value === 'SAVINGS'); });
    }
  }
}

// Bidirectional Home Branch sync (Item 2 & 4)
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
  if (!code && val && BRANCH_DIRECTORY[val]) {
    code = BRANCH_DIRECTORY[val].code;
  }

  const c1 = document.getElementById('step1-branch-code');
  const c2 = document.getElementById('step2-branch-code');
  if (c1) c1.value = code;
  if (c2) c2.value = code;

  debounceSaveDraft();
}

// Prefix "Other" toggle across all form sections (Item 4)
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
  debounceSaveDraft();
}

// "Others" toggle across the form (Item 4)
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
  debounceSaveDraft();
}

// Country flag dropdown change handler with dynamic box resizing (Item 5)
function handleCountryCodeChange(target, code) {
  const selectId = target === 'mobile' ? 'mobile-country-code' : 'alt-mobile-country-code';
  const wrap = document.querySelector(`.bank-box-wrap[data-target="${target}"]`);
  const select = document.getElementById(selectId);
  const digits = (select && select.selectedOptions && select.selectedOptions[0])
    ? parseInt(select.selectedOptions[0].getAttribute('data-digits') || '10', 10)
    : 10;

  if (wrap) {
    wrap.setAttribute('data-box-count', digits);
    const input = wrap.querySelector('.bank-box-input');
    const cellsContainer = wrap.querySelector('.bank-box-cells');
    if (input) {
      input.maxLength = digits;
      input.value = input.value.replace(/\D/g, '').slice(0, digits);
    }
    if (cellsContainer) {
      let cellsHtml = '';
      for (let i = 0; i < digits; i++) {
        cellsHtml += `<span class="char-cell notranslate" translate="no" data-idx="${i}">&nbsp;</span>`;
      }
      cellsContainer.innerHTML = cellsHtml;
      if (input && input.value) {
        updateBoxCells(wrap, input.value);
      }
    }
  }

  if (target === 'mobile') {
    const rawInput = document.getElementById('raw-mobile-number');
    const hPhone = document.getElementById('hidden-phone');
    if (rawInput && hPhone) {
      hPhone.value = rawInput.value ? `${code}${rawInput.value}` : '';
    }
  }
  debounceSaveDraft();
}

// Dynamically adapt form fields based on selected account type
function adaptFieldsForAccountType(type) {
  const inputEl = document.getElementById('apply-selected-account-type');
  if (inputEl) inputEl.value = type;

  const quickSelect = document.getElementById('quick-account-type-select');
  if (quickSelect && quickSelect.value !== type) quickSelect.value = type;

  const badgeEl = document.getElementById('step2-selected-account-badge');
  if (badgeEl) badgeEl.textContent = formatHumanText(type);

  const depositInput = document.querySelector('input[name="initialDeposit"]');
  const depositHint = document.getElementById('deposit-account-hint');
  const empSelect = document.getElementById('input-emp-status');
  const studentHint = document.getElementById('student-age-hint');
  const dobInput = document.querySelector('input[name="dob"]');
  const doc2Title = document.getElementById('step3-doc2-title');
  const doc2Hint = document.getElementById('step3-doc2-hint');

  if (type === 'SAVINGS') {
    if (depositInput) {
      depositInput.min = '1000.00';
      if (parseFloat(depositInput.value || 0) < 1000) depositInput.value = '1000.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ High-Yield Savings requires an initial minimum deposit of ₹ 1,000.00.';
      depositHint.style.color = 'var(--emerald-400)';
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Proof of Address';
    if (doc2Hint) doc2Hint.textContent = 'Utility bill, bank statement, or council tax bill less than 3 months old.';
  } else if (type === 'CHECKING') {
    if (depositInput) {
      depositInput.min = '500.00';
      depositInput.value = '500.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Everyday Checking has zero minimum daily balance (₹ 500.00 suggested initial deposit).';
      depositHint.style.color = 'var(--brand-500)';
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Proof of Address';
    if (doc2Hint) doc2Hint.textContent = 'Utility bill or recent statement for address verification.';
  } else if (type === 'SALARY') {
    if (depositInput) {
      depositInput.min = '0.00';
      depositInput.value = '0.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Corporate Salary Account requires zero minimum deposit (₹0.00).';
      depositHint.style.color = 'var(--emerald-400)';
    }
    if (empSelect) {
      if (empSelect.value !== 'EMPLOYED' && empSelect.value !== 'SELF_EMPLOYED') {
        empSelect.value = 'EMPLOYED';
        handleEmploymentChange('EMPLOYED');
      }
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Employment & Income Proof';
    if (doc2Hint) doc2Hint.textContent = 'Recent corporate salary payslip, employee ID card, or employment offer letter.';
  } else if (type === 'FIXED_DEPOSIT') {
    if (depositInput) {
      depositInput.min = '10000.00';
      if (parseFloat(depositInput.value || 0) < 10000) depositInput.value = '10000.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Fixed / Term Deposit requires minimum principal lock-in of ₹ 10,000.00 (Guaranteed 5.25% APY).';
      depositHint.style.color = 'var(--emerald-400)';
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Source of Funds / Bank Statement';
    if (doc2Hint) doc2Hint.textContent = 'Recent bank statement or financial verification proving origin of deposit funds.';
  } else if (type === 'MONEY_MARKET') {
    if (depositInput) {
      depositInput.min = '5000.00';
      if (parseFloat(depositInput.value || 0) < 5000) depositInput.value = '5000.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Money Market / Recurring Deposit requires minimum initial deposit of ₹ 5,000.00.';
      depositHint.style.color = 'var(--emerald-400)';
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Proof of Address & Liquidity';
    if (doc2Hint) doc2Hint.textContent = 'Utility bill, bank statement, or proof of recurring fund source.';
  } else if (type === 'JOINT') {
    if (depositInput) {
      depositInput.min = '1000.00';
      if (parseFloat(depositInput.value || 0) < 1000) depositInput.value = '1000.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Joint Account requires ₹ 1,000.00 initial deposit. Multiple co-applicant details supported in Section 6.';
      depositHint.style.color = 'var(--purple-400)';
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Secondary Applicant ID / Shared Address';
    if (doc2Hint) doc2Hint.textContent = 'Co-applicant government ID scan and joint residential lease or utility statement.';
  } else if (type === 'NRI_EXPAT') {
    if (depositInput) {
      depositInput.min = '5000.00';
      if (parseFloat(depositInput.value || 0) < 5000) depositInput.value = '5000.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ NRI / Foreign Expat requires ₹ 5,000.00 (or $100 equivalent) initial deposit and overseas residence/work visa.';
      depositHint.style.color = 'var(--sky-400)';
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Foreign Residence Permit / Work Visa';
    if (doc2Hint) doc2Hint.textContent = 'Valid overseas work permit, visa page, and host country utility bill.';
  } else if (type === 'STUDENT') {
    if (depositInput) {
      depositInput.min = '0.00';
      depositInput.value = '0.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Campus Student Account has zero deposit requirement (₹0.00) and no monthly fees.';
      depositHint.style.color = 'var(--amber-400)';
    }
    if (empSelect) {
      empSelect.value = 'STUDENT';
      handleEmploymentChange('STUDENT');
    }
    if (studentHint) studentHint.style.display = 'block';
    if (dobInput && dobInput.value === '1996-08-20') {
      dobInput.value = '2004-05-15'; // Age ~22 (satisfies 16-26 requirement)
    }
    if (doc2Title) doc2Title.textContent = '2. Student Status & Enrollment Proof';
    if (doc2Hint) doc2Hint.textContent = 'Student ID card, university acceptance letter, or dormitory residency proof.';
  } else if (type === 'PENSION') {
    if (depositInput) {
      depositInput.min = '0.00';
      depositInput.value = '0.00';
    }
    if (depositHint) {
      depositHint.style.display = 'block';
      depositHint.textContent = '✓ Pension Savings Account has zero minimum balance (₹0.00) and direct treasury PPO credit integration.';
      depositHint.style.color = 'var(--emerald-400)';
    }
    if (empSelect) {
      empSelect.value = 'RETIRED';
      handleEmploymentChange('RETIRED');
    }
    if (studentHint) studentHint.style.display = 'none';
    if (doc2Title) doc2Title.textContent = '2. Pension Sanction Order / Disability Certificate';
    if (doc2Hint) doc2Hint.textContent = 'Pension Payment Order (PPO), EPFO certificate, or Government Disability Card (UDID).';
  }
}

// Dynamically change fields based on Employment Status
function handleEmploymentChange(status) {
  const empGroup = document.getElementById('emp-field-group');
  const empLabel = document.getElementById('emp-field-label');
  const empInput = document.getElementById('input-employer');
  const studentGroup = document.getElementById('student-field-group');
  const incomeLabel = document.getElementById('income-field-label');

  if (status === 'EMPLOYED') {
    // Only Employer Name appears
    if (empGroup) empGroup.style.display = 'block';
    if (empLabel) empLabel.textContent = 'Employer Name';
    if (empInput) {
      empInput.placeholder = 'e.g. Enterprise Ltd / Public Sector Dept';
      empInput.required = true;
      if (!empInput.value || empInput.value === 'Self-Employed' || empInput.value === 'Student' || empInput.value === 'Retired') {
        empInput.value = 'Enterprise Ltd';
      }
    }
    if (studentGroup) studentGroup.style.display = 'none';
    if (incomeLabel) incomeLabel.textContent = 'Annual Salary / Income (₹ / INR)';
  } else if (status === 'SELF_EMPLOYED') {
    // Business / Company Name appears
    if (empGroup) empGroup.style.display = 'block';
    if (empLabel) empLabel.textContent = 'Business / Registered Company Name';
    if (empInput) {
      empInput.placeholder = 'e.g. Acme Innovations Ltd / Independent Consultancy';
      empInput.required = true;
      if (!empInput.value || empInput.value === 'Enterprise Ltd') {
        empInput.value = 'Acme Consulting Ltd';
      }
    }
    if (studentGroup) studentGroup.style.display = 'none';
    if (incomeLabel) incomeLabel.textContent = 'Annual Business Revenue / Profit (₹ / INR)';
  } else if (status === 'STUDENT') {
    // Employer Name is HIDDEN
    if (empGroup) empGroup.style.display = 'none';
    if (empInput) {
      empInput.required = false;
      empInput.value = '';
    }
    if (studentGroup) studentGroup.style.display = 'block';
    if (incomeLabel) incomeLabel.textContent = 'Annual Allowance / Student Stipend (₹ / INR)';
  } else if (status === 'RETIRED') {
    // Employer Name is HIDDEN
    if (empGroup) empGroup.style.display = 'none';
    if (empInput) {
      empInput.required = false;
      empInput.value = '';
    }
    if (studentGroup) studentGroup.style.display = 'none';
    if (incomeLabel) incomeLabel.textContent = 'Annual Pension / Retirement Income (₹ / INR)';
  } else if (status === 'UNEMPLOYED') {
    // Employer Name is HIDDEN
    if (empGroup) empGroup.style.display = 'none';
    if (empInput) {
      empInput.required = false;
      empInput.value = '';
    }
    if (studentGroup) studentGroup.style.display = 'none';
    if (incomeLabel) incomeLabel.textContent = 'Annual Income / Savings Support (₹ / INR)';
  }
}

// =================================================================
// AUTHENTIC PHYSICAL BANK ACCOUNT OPENING FORM SHEET LOGIC
// Dynamic Square Character Boxes, Auto-Resized Photo, Signature Modal
// =================================================================

// =================================================================
// AUTHENTIC PHYSICAL BANK ACCOUNT OPENING FORM SHEET LOGIC
// Direct Segmented Box Inputs, Save/Restore Draft, Clear All,
// Signature & Thumb Biometrics, Part Switching, Dynamic Joint Section
// =================================================================

let signaturePadState = {
  canvas: null,
  ctx: null,
  isDrawing: false,
  hasSignature: false,
  penColor: 'var(--bg-panel)', // Deep Bank Navy ink
  lineWidth: 2.5,
  lastX: 0,
  lastY: 0
};

let currentUploadedThumbData = null;
let currentActiveFormPart = 'part1';

// ----------------------------------------------------------------- DIRECT SEGMENTED BOX INPUTS CONTROLLER
function initBankBoxInputs() {
  if (typeof window.initBankBoxInputsModular === 'function') {
    return window.initBankBoxInputsModular();
  }

  const boxWraps = document.querySelectorAll('.bank-box-wrap');
  const maxFreeTextLen = window.MAX_NAME_LENGTH || (typeof NeoBankConstants !== 'undefined' ? NeoBankConstants.MAX_NAME_LENGTH : 50);

  boxWraps.forEach(wrap => {
    const boxCount = parseInt(wrap.getAttribute('data-box-count') || '24', 10);
    const cellsContainer = wrap.querySelector('.bank-box-cells');
    const input = wrap.querySelector('.bank-box-input');
    const targetName = wrap.getAttribute('data-target') || '';
    if (!cellsContainer || !input) return;

    const isFixed = ['taxId', 'ckycNumber', 'cifNumber', 'mobile', 'altMobile', 'postalCode', 'corrPostalCode', 'aadhaarNumber', 'applicationDate', 'dob', 'accountNumber'].includes(targetName);
    if (!isFixed) {
      input.maxLength = maxFreeTextLen;
      const parent = wrap.closest('.char-input-group') || wrap.parentElement;
      const labelRow = parent ? parent.querySelector('.char-input-label-row') : null;
      const hintContainer = labelRow ? (labelRow.querySelector('.char-label-with-hint') || labelRow) : null;
      if (hintContainer && !labelRow.querySelector('.char-box-limit-hint')) {
        const hintSpan = document.createElement('span');
        hintSpan.className = 'char-box-limit-hint notranslate';
        hintSpan.setAttribute('translate', 'no');
        hintSpan.setAttribute('data-target-input', input.id || targetName);
        hintSpan.innerHTML = `
          <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
          <span class="char-limit-counter"><span class="char-count-current">${(input.value || '').length}</span>/50</span>
        `;
        hintContainer.appendChild(hintSpan);
      }
    }

    // Check if custom segmented markup (like date with separators) already exists
    const hasStaticCells = cellsContainer.querySelectorAll('.char-cell').length > 0;
    if (!hasStaticCells) {
      let cellsHtml = '';
      if (boxCount === 12 && targetName === 'aadhaarNumber') {
        // Special 4-4-4 Aadhaar segment formatting
        for (let i = 0; i < 12; i++) {
          if (i === 4 || i === 8) {
            cellsHtml += `<span class="date-separator" style="margin:0 2px">-</span>`;
          }
          cellsHtml += `<span class="char-cell notranslate" translate="no" data-idx="${i}">&nbsp;</span>`;
        }
      } else {
        for (let i = 0; i < boxCount; i++) {
          cellsHtml += `<span class="char-cell notranslate" translate="no" data-idx="${i}">&nbsp;</span>`;
        }
      }
      cellsContainer.innerHTML = cellsHtml;
    }

    // Direct click on wrap focuses the transparent input
    wrap.addEventListener('click', (e) => {
      if (e.target !== input) {
        input.focus();
      }
    });

    // Update cells on typing / pasting
    input.addEventListener('input', (e) => {
      let val = e.target.value;

      // Sanitize input based on field type
      if (targetName === 'taxId') {
        val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        e.target.value = val;
      } else if (targetName === 'ckycNumber') {
        val = val.replace(/\D/g, '').slice(0, 14);
        e.target.value = val;
      } else if (targetName === 'cifNumber') {
        val = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
        e.target.value = val;
      } else if (targetName === 'mobile' || targetName === 'altMobile') {
        const countrySelect = document.getElementById(targetName === 'mobile' ? 'mobile-country-code' : 'alt-mobile-country-code');
        const maxLen = (countrySelect && countrySelect.selectedOptions && countrySelect.selectedOptions[0]) 
          ? parseInt(countrySelect.selectedOptions[0].getAttribute('data-digits') || '10', 10) 
          : 10;
        val = val.replace(/\D/g, '').slice(0, maxLen);
        e.target.value = val;
        if (targetName === 'mobile') {
          const prefix = countrySelect ? countrySelect.value : '+91';
          const hPhone = document.getElementById('hidden-phone');
          if (hPhone) hPhone.value = val ? prefix + val : '';
        }
      } else if (targetName === 'postalCode' || targetName === 'corrPostalCode') {
        val = val.replace(/\D/g, '').slice(0, 6);
        e.target.value = val;
      } else if (targetName === 'aadhaarNumber') {
        val = val.replace(/\D/g, '').slice(0, 12);
        e.target.value = val;
      } else if (targetName === 'applicationDate' || targetName === 'dob') {
        val = val.replace(/\D/g, '').slice(0, 8);
        e.target.value = val;
      } else {
        val = val.toUpperCase().slice(0, maxFreeTextLen);
        e.target.value = val;
      }

      updateBoxCells(wrap, val);

      if (['firstName', 'middleName', 'lastName'].includes(targetName)) {
        syncApplicantFullName();
      }

      // Instant clear of validation error upon entering valid data (Requirement 3)
      if (typeof clearErrorOnValidInput === 'function') {
        clearErrorOnValidInput(e.target);
      }

      // Auto-save draft on user change (debounced)
      debounceSaveDraft();
    });

    // Track caret highlight on focus and blur
    input.addEventListener('focus', () => {
      wrap.classList.add('focused');
      updateBoxCells(wrap, input.value);
    });

    input.addEventListener('blur', () => {
      wrap.classList.remove('focused');
      const cells = cellsContainer.querySelectorAll('.char-cell');
      cells.forEach(c => c.classList.remove('caret-active'));
    });

    // Initial render of cells
    updateBoxCells(wrap, input.value || '');
  });
}

function updateBoxCells(wrap, text) {
  if (typeof window.updateBoxCellsModular === 'function') {
    return window.updateBoxCellsModular(wrap, text);
  }
  const cellsContainer = wrap.querySelector('.bank-box-cells');
  const input = wrap.querySelector('.bank-box-input');
  if (!cellsContainer) return;

  const isFocused = input === document.activeElement;
  const str = (text || '').toString();
  const targetName = wrap.getAttribute('data-target') || '';
  const initialBoxCount = parseInt(wrap.getAttribute('data-box-count') || '24', 10);
  const isFixed = ['taxId', 'ckycNumber', 'cifNumber', 'mobile', 'altMobile', 'postalCode', 'corrPostalCode', 'aadhaarNumber', 'applicationDate', 'dob', 'accountNumber'].includes(targetName);

  if (!isFixed) {
    const maxLen = window.MAX_NAME_LENGTH || (typeof NeoBankConstants !== 'undefined' ? NeoBankConstants.MAX_NAME_LENGTH : 50);
    // Keep at least initialBoxCount boxes, and always at least str.length + 1 boxes ready for the next character (up to maxLen)
    const neededCount = Math.min(maxLen, Math.max(initialBoxCount, str.length + 1));
    let cellList = cellsContainer.querySelectorAll('.char-cell');

    while (cellList.length < neededCount) {
      const idx = cellList.length;
      const newCell = document.createElement('span');
      newCell.className = 'char-cell notranslate';
      newCell.setAttribute('translate', 'no');
      newCell.setAttribute('data-idx', String(idx));
      newCell.innerHTML = '&nbsp;';
      cellsContainer.appendChild(newCell);
      cellList = cellsContainer.querySelectorAll('.char-cell');
    }

    while (cellList.length > neededCount && cellList.length > initialBoxCount) {
      cellsContainer.removeChild(cellsContainer.lastElementChild);
      cellList = cellsContainer.querySelectorAll('.char-cell');
    }
  }

  const cells = cellsContainer.querySelectorAll('.char-cell');
  cells.forEach((cell, idx) => {
    cell.classList.remove('caret-active');
    if (idx < str.length) {
      const ch = str[idx];
      cell.textContent = ch === ' ' ? '\u00A0' : ch;
      cell.classList.add('filled');
    } else {
      cell.textContent = '\u00A0';
      cell.classList.remove('filled');
    }

    if (isFocused && idx === str.length) {
      cell.classList.add('caret-active');
    }
  });
}

// ----------------------------------------------------------------- DATE PICKER HELPER
function setDateFromPicker(val, inputId, wrapId) {
  // val is 'YYYY-MM-DD'
  if (!val || !val.includes('-')) return;
  const parts = val.split('-');
  const dd = parts[2];
  const mm = parts[1];
  const yyyy = parts[0];

  // Disallow future dates and pre-1900 dates (Requirements 3 & 4)
  const chosenYear = parseInt(yyyy, 10);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const chosenDate = new Date(chosenYear, parseInt(mm, 10) - 1, parseInt(dd, 10));
  if (chosenYear < 1900 || chosenDate > today) {
    showToast('Invalid date. Date must be between 1900 and today.', 'error');
    return;
  }

  const formatted = `${dd}${mm}${yyyy}`; // 8 digits

  const input = document.getElementById(inputId);
  const wrap = document.getElementById(wrapId);
  if (input) {
    input.value = formatted;
    if (wrap) updateBoxCells(wrap, formatted);
    if (typeof clearErrorOnValidInput === 'function') {
      clearErrorOnValidInput(input);
    }
  }

  // Update declaration date in Section 7
  if (inputId === 'raw-header-date') {
    const declDateEl = document.getElementById('paper-declaration-date');
    if (declDateEl) declDateEl.textContent = `${dd} / ${mm} / ${yyyy}`;
  }

  debounceSaveDraft();
}

// ----------------------------------------------------------------- FULL NAME SYNC
function syncApplicantFullName() {
  const firstInput = document.getElementById('raw-first-name');
  const middleInput = document.getElementById('raw-middle-name');
  const lastInput = document.getElementById('raw-last-name');

  const first = firstInput ? firstInput.value.trim() : '';
  const last = lastInput ? lastInput.value.trim() : '';
  const middle = middleInput ? middleInput.value.trim() : '';

  const parts = [first, middle, last].filter(Boolean);
  const fullName = parts.join(' ').toUpperCase() || 'APPLICANT';

  // Update form signature label & declaration place
  const sigNameDisplay = document.getElementById('form-signature-name-display');
  if (sigNameDisplay) sigNameDisplay.textContent = fullName;

  const jointPrimary = document.getElementById('joint-primary-name');
  if (jointPrimary) jointPrimary.textContent = fullName + ' (Primary Applicant)';

  const modalSignAs = document.getElementById('signature-modal-sign-as');
  if (modalSignAs) {
    const escFn = window.escapeHtml || (s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
    modalSignAs.innerHTML = `Sign as: <strong style="color:var(--brand-500)">${escFn(fullName)}</strong>`;
  }

  return fullName;
}

// ----------------------------------------------------------------- MIDDLE NAME TOGGLE (LEGACY SAFEGUARD)
function toggleMiddleName(isOmitted) {
  // Middle name is a standard optional text input without toggle removal
  const inputWrap = document.getElementById('middle-name-input-wrap');
  if (inputWrap) inputWrap.style.display = 'inline-flex';
  syncApplicantFullName();
  debounceSaveDraft();
}

// ----------------------------------------------------------------- ADDRESS TOGGLE & CITY SYNC
function toggleCorrAddress(val) {
  const corrFields = document.getElementById('corr-address-fields');
  if (corrFields) {
    corrFields.style.display = (val === 'NO') ? 'block' : 'none';
  }
}

function toggleNominationFields(val) {
  const container = document.getElementById('nomination-fields-container');
  if (container) {
    container.style.display = (val === 'REGISTER') ? 'block' : 'none';
  }
}

function toggleFatcaFields(val) {
  const container = document.getElementById('fatca-foreign-details');
  if (container) {
    container.style.display = (val === 'OUTSIDE_INDIA') ? 'grid' : 'none';
  }
}

// ----------------------------------------------------------------- SECTION 5 OVD MIRRORING & UPLOAD
function syncOvdSelection(type) {
  const idTypeSelect = document.querySelector('select[name="idDocType"]');
  const idNumInput = document.getElementById('step3-id-doc-number');
  const idExpInput = document.getElementById('step3-id-expiry-date');

  let docNumber = '';
  let expiry = '';

  if (type === 'PASSPORT') {
    if (idTypeSelect) idTypeSelect.value = 'PASSPORT';
    docNumber = (document.querySelector('input[name="ovdPassportNum"]') || {}).value || '';
    expiry = (document.querySelector('input[name="ovdPassportExpiry"]') || {}).value || '';
  } else if (type === 'DRIVING_LICENSE') {
    if (idTypeSelect) idTypeSelect.value = 'DRIVERS_LICENSE';
    docNumber = (document.querySelector('input[name="ovdLicenseNum"]') || {}).value || '';
    expiry = (document.querySelector('input[name="ovdLicenseExpiry"]') || {}).value || '';
  } else if (type === 'VOTER_ID' || type === 'AADHAAR' || type === 'NREGA' || type === 'NPR') {
    if (idTypeSelect) idTypeSelect.value = 'NATIONAL_ID';
    if (type === 'VOTER_ID') docNumber = (document.querySelector('input[name="ovdVoterNum"]') || {}).value || '';
    if (type === 'AADHAAR') docNumber = (document.querySelector('input[name="ovdAadhaarNum"]') || {}).value || '';
    if (type === 'NREGA') docNumber = (document.querySelector('input[name="ovdNregaNum"]') || {}).value || '';
    if (type === 'NPR') docNumber = (document.querySelector('input[name="ovdNprNum"]') || {}).value || '';
  } else if (type === 'OTHER') {
    if (idTypeSelect) idTypeSelect.value = 'NATIONAL_ID';
    docNumber = (document.querySelector('input[name="ovdOtherNum"]') || {}).value || '';
    expiry = (document.querySelector('input[name="ovdOtherExpiry"]') || {}).value || '';
    const otherName = document.getElementById('ovd-other-name');
    if (otherName) otherName.style.display = 'block';
  }

  if (idNumInput && docNumber) idNumInput.value = docNumber;
  if (idExpInput && expiry) idExpInput.value = expiry;
  debounceSaveDraft();
}

// Handle direct certified copy file upload in OVD table (Item 6)
function handleOvdFileUpload(input, statusSpanId, docType) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const span = document.getElementById(statusSpanId);
  if (span) {
    span.textContent = `✓ ${file.name}`;
    span.style.color = 'var(--emerald-400)';
    span.style.fontWeight = '700';
    span.title = file.name;
  }

  // Automatically check this document row's checkbox
  const chk = document.querySelector(`input[name="ovdSelectChk"][value="${docType}"]`) ||
              document.querySelector(`input[name="ovdSelectRadio"][value="${docType}"]`);
  if (chk) {
    chk.checked = true;
    if (typeof syncOvdSelection === 'function') syncOvdSelection(docType, true);
  }

  // Immediately clear any OVD validation error on header and table
  const ovdHeader = document.getElementById('header-sec-ovd');
  if (ovdHeader) {
    ovdHeader.classList.remove('field-invalid-mandatory');
    ovdHeader.classList.remove('label-invalid-mandatory');
  }
  const ovdTable = document.querySelector('.bank-table-grid');
  if (ovdTable) {
    ovdTable.classList.remove('field-invalid-mandatory');
  }

  if (typeof updateLiveMissingCounters === 'function') {
    updateLiveMissingCounters();
  }
  if (typeof refreshMissingBadges === 'function') {
    refreshMissingBadges();
  }

  showToast(`Attached certified copy: ${file.name}`, 'success');
  debounceSaveDraft();
}

// Sync OVD inputs when user enters text into doc number fields
function syncOvdInput(docType, val) {
  const chk = document.querySelector(`input[name="ovdSelectChk"][value="${docType}"]`) ||
              document.querySelector(`input[name="ovdSelectRadio"][value="${docType}"]`);
  if (chk && !chk.checked && val && val.trim().length > 0) {
    chk.checked = true;
  }
  if (typeof syncOvdSelection === 'function') syncOvdSelection(docType, true);
  if (typeof updateLiveMissingCounters === 'function') {
    updateLiveMissingCounters();
  }
}

// ----------------------------------------------------------------- PART SWITCHER (Item 11)
// ----------------------------------------------------------------- PART SWITCHER (Page 1, 2, 3, 4, All)
function switchFormPart(part) {
  currentActiveFormPart = part;
  const p1 = document.getElementById('form-container-part1');
  const p1cont = document.getElementById('form-container-part1-cont');
  const p2 = document.getElementById('form-container-part2');
  const p3 = document.getElementById('form-container-part3');

  document.querySelectorAll('.part-nav-btn').forEach(b => b.classList.remove('active'));

  if (part === 'part1') {
    if (p1) p1.style.display = 'block';
    if (p1cont) p1cont.style.display = 'none';
    if (p2) p2.style.display = 'none';
    if (p3) p3.style.display = 'none';
    const btn = document.getElementById('btn-tab-part1');
    if (btn) btn.classList.add('active');
  } else if (part === 'part1-cont') {
    if (p1) p1.style.display = 'none';
    if (p1cont) p1cont.style.display = 'block';
    if (p2) p2.style.display = 'none';
    if (p3) p3.style.display = 'none';
    const btn = document.getElementById('btn-tab-part1-cont');
    if (btn) btn.classList.add('active');
  } else if (part === 'part2') {
    if (p1) p1.style.display = 'none';
    if (p1cont) p1cont.style.display = 'none';
    if (p2) p2.style.display = 'block';
    if (p3) p3.style.display = 'none';
    const btn = document.getElementById('btn-tab-part2');
    if (btn) btn.classList.add('active');
  } else if (part === 'part3') {
    if (p1) p1.style.display = 'none';
    if (p1cont) p1cont.style.display = 'none';
    if (p2) p2.style.display = 'none';
    if (p3) p3.style.display = 'block';
    const btn = document.getElementById('btn-tab-part3');
    if (btn) btn.classList.add('active');
  } else {
    // 'all' parts
    if (p1) p1.style.display = 'block';
    if (p1cont) p1cont.style.display = 'block';
    if (p2) p2.style.display = 'block';
    if (p3) p3.style.display = 'block';
    const btn = document.getElementById('btn-tab-all');
    if (btn) btn.classList.add('active');
  }

  updateFlowActionButtons(part);
  if (typeof window.translatePage === 'function') {
    const curLang = (typeof window.getCurrentLanguage === 'function') ? window.getCurrentLanguage() : 'en';
    window.translatePage(curLang);
  }
}

// ----------------------------------------------------------------- FLOATING ACTION BAR & MULTI-STEP FLOW (Requirement 8)
function updateFlowActionButtons(part) {
  const primaryBtn = document.getElementById('btn-primary-flow-action');
  const prevBtn = document.getElementById('btn-floating-prev');
  if (!primaryBtn) return;

  if (part === 'part3' || part === 'all') {
    primaryBtn.textContent = 'Submit Complete Application';
    primaryBtn.className = 'btn btn-success';
  } else {
    primaryBtn.textContent = 'Save & Next →';
    primaryBtn.className = 'btn btn-primary';
  }

  if (prevBtn) {
    if (part === 'part1') {
      prevBtn.textContent = '← Back to Account Selection';
    } else if (part === 'part1-cont') {
      prevBtn.textContent = '← Back to Page 1';
    } else if (part === 'part2') {
      prevBtn.textContent = '← Back to Page 2';
    } else if (part === 'part3') {
      prevBtn.textContent = '← Back to Page 3';
    } else {
      prevBtn.textContent = '← Back to Page 1';
    }
  }
}

function handlePrimaryFlowAction() {
  if (currentActiveFormPart === 'part3' || currentActiveFormPart === 'all') {
    submitCustomerApplication();
  } else {
    handleSaveAndNext();
  }
}
window.handlePrimaryFlowAction = handlePrimaryFlowAction;

function handleSaveAndNext() {
  saveCustomerFormDraft(false);
  if (currentActiveFormPart === 'part1') {
    switchFormPart('part1-cont');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (currentActiveFormPart === 'part1-cont') {
    switchFormPart('part2');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (currentActiveFormPart === 'part2') {
    switchFormPart('part3');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    submitCustomerApplication();
  }
}
window.handleSaveAndNext = handleSaveAndNext;

function handleFormPrevStep() {
  if (currentActiveFormPart === 'part1') {
    goToOnboardingStep(1);
  } else if (currentActiveFormPart === 'part1-cont') {
    switchFormPart('part1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (currentActiveFormPart === 'part2') {
    switchFormPart('part1-cont');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (currentActiveFormPart === 'part3') {
    switchFormPart('part2');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    switchFormPart('part1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
window.handleFormPrevStep = handleFormPrevStep;

// ----------------------------------------------------------------- CONDITIONAL DEBIT CARD (Requirement 11)
function handleDebitCardRequiredToggle(val) {
  const section = document.getElementById('debit-card-dependent-fields');
  if (section) {
    section.style.display = (val === 'YES') ? 'block' : 'none';
  }
  debounceSaveDraft();
}
window.handleDebitCardRequiredToggle = handleDebitCardRequiredToggle;

// ----------------------------------------------------------------- PASSWORD VISIBILITY TOGGLE (Requirement 7)
function togglePasswordVisibility(inputId, btn) {
  if (window.NeoBankUtils && typeof window.NeoBankUtils.togglePasswordVisibility === 'function') {
    return window.NeoBankUtils.togglePasswordVisibility(inputId, btn);
  }
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isPwd = inp.type === 'password';
  inp.type = isPwd ? 'text' : 'password';
  if (btn) {
    btn.innerHTML = isPwd
      ? `<svg class="icon-eye-off" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg class="icon-eye" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}
window.togglePasswordVisibility = togglePasswordVisibility;

// ----------------------------------------------------------------- DYNAMIC TOGGLES: DISABILITY, FORM 60, PEP
function handleDisabilityToggle(val) {
  const section = document.getElementById('disability-details-section');
  if (section) {
    section.style.display = (val === 'YES') ? 'block' : 'none';
  }
  debounceSaveDraft();
}

function handleForm60Toggle(val) {
  const card = document.getElementById('form60-upload-card');
  if (card) {
    card.style.display = (val === 'YES') ? 'flex' : 'none';
  }
  debounceSaveDraft();
}

function handlePepToggle(val) {
  const section = document.getElementById('pep-details-section');
  if (section) {
    section.style.display = (val === 'PEP' || val === 'RELATED') ? 'block' : 'none';
  }
  debounceSaveDraft();
}

function handleGenericFileUpload(input, statusSpanId) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const span = document.getElementById(statusSpanId);
  if (span) {
    span.textContent = `✓ Attached: ${file.name}`;
    span.style.color = 'var(--emerald-400)';
    span.style.fontWeight = '700';
    span.title = file.name;
  }
  showToast(`Attached file: ${file.name}`, 'success');
  debounceSaveDraft();
}

// ----------------------------------------------------------------- EMAIL DOMAIN SELECTOR & POPUP MODAL (Fix 6)
let previousEmailDomain = '@gmail.com';

function handleEmailDomainChange(domain) {
  if (typeof window.handleEmailDomainChange === 'function' && window.handleEmailDomainChange !== handleEmailDomainChange) {
    window.handleEmailDomainChange(domain);
    return;
  }
  const dSel = document.getElementById('email-domain-select');
  const inlineWrap = document.getElementById('email-domain-custom-inline');
  const inlineInput = document.getElementById('inline-custom-domain-input');
  if (domain === 'OTHER') {
    if (dSel) dSel.style.display = 'none';
    if (inlineWrap) inlineWrap.style.display = 'inline-flex';
    if (inlineInput) {
      inlineInput.value = '';
      inlineInput.focus();
    }
  } else {
    previousEmailDomain = domain;
    syncCombinedEmail();
  }
}
if (!window.handleEmailDomainChange) {
  window.handleEmailDomainChange = handleEmailDomainChange;
}

function syncCombinedEmail() {
  const uInp = document.getElementById('email-username');
  const dSel = document.getElementById('email-domain-select');
  const hEmail = document.getElementById('hidden-combined-email');

  const username = uInp ? uInp.value.trim() : '';
  let domain = dSel ? dSel.value : '@gmail.com';
  if (domain === 'OTHER') {
    domain = previousEmailDomain || '@custom.com';
  }

  const combined = username ? `${username}${domain}` : '';
  if (hEmail) hEmail.value = combined;
  debounceSaveDraft();
}

// ----------------------------------------------------------------- BIDIRECTIONAL PIN CODE & ADDRESS LOOKUP (Item 13)
function handlePincodeInput(pinVal) {
  const cleaned = (pinVal || '').toString().replace(/\D/g, '').slice(0, 6);
  if (cleaned.length === 6) {
    const prefix = cleaned.substring(0, 3);
    const match = PIN_DIRECTORY.find(p => p.pin === cleaned || p.pinPrefix === prefix);
    if (match) {
      const cityInp = document.getElementById('input-city');
      const distInp = document.getElementById('input-district');
      const stateInp = document.getElementById('input-state');
      if (cityInp && (!cityInp.value || cityInp.value.trim().length === 0)) {
        cityInp.value = match.city;
      }
      if (distInp && (!distInp.value || distInp.value.trim().length === 0)) {
        distInp.value = match.district;
      }
      if (stateInp && (!stateInp.value || stateInp.value.trim().length === 0)) {
        stateInp.value = match.state;
      }
      showToast(`Autofilled location for PIN ${cleaned}: ${match.city}, ${match.state}`, 'info');
    }
  }
}

function handleCityInput(cityVal) {
  if (!cityVal || cityVal.trim().length < 3) return;
  const lower = cityVal.trim().toLowerCase();
  const match = PIN_DIRECTORY.find(p => p.city.toLowerCase().startsWith(lower) || lower.startsWith(p.city.toLowerCase()));
  if (match) {
    const distInp = document.getElementById('input-district');
    const stateInp = document.getElementById('input-state');
    const pinInp = document.getElementById('raw-pincode');
    const pinWrap = pinInp ? pinInp.closest('.bank-box-wrap') : null;

    if (distInp && !distInp.value) distInp.value = match.district;
    if (stateInp && !stateInp.value) stateInp.value = match.state;
    if (pinInp && (!pinInp.value || pinInp.value.length < 6)) {
      pinInp.value = match.pin;
      if (pinWrap) updateBoxCells(pinWrap, match.pin);
    }
  }
  const placeEl = document.getElementById('paper-declaration-place');
  if (placeEl) placeEl.textContent = cityVal.toUpperCase() || 'MUMBAI';
}

function handleDistrictInput(distVal) {
  if (!distVal || distVal.trim().length < 3) return;
  const lower = distVal.trim().toLowerCase();
  const match = PIN_DIRECTORY.find(p => p.district.toLowerCase().startsWith(lower));
  if (match) {
    const stateInp = document.getElementById('input-state');
    if (stateInp && !stateInp.value) stateInp.value = match.state;
  }
}

function handleStateInput(stateVal) {
  debounceSaveDraft();
}

// ----------------------------------------------------------------- SECTION 6.3 DEEMED PROOFS UPLOADS (Item 14)
function handleDeemedProofChange() {
  const container = document.getElementById('deemed-proof-uploads-container');
  const list = document.getElementById('deemed-proof-uploads-list');
  if (!container || !list) return;

  const checkedBoxes = Array.from(document.querySelectorAll('input[name="deemedProofChk"]:checked'));
  if (checkedBoxes.length === 0) {
    container.style.display = 'none';
    list.innerHTML = '';
    return;
  }

  const proofLabels = {
    'UTILITY': 'Electricity / Gas / Water Bill (less than 2 months old)',
    'PROPERTY_TAX': 'Property / Municipal Tax Receipt (recent)',
    'PENSION_ORDER': 'PPO / Pension Order (with current address)',
    'GOVT_ACCOMMODATION': 'Government Accommodation Allotment Letter',
    'LEAVE_LICENSE': 'Employer Leave & License Agreement'
  };

  let html = '';
  checkedBoxes.forEach(chk => {
    const val = chk.value;
    const label = proofLabels[val] || val;
    html += `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0.6rem;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:4px;gap:0.75rem;flex-wrap:wrap">
        <div style="font-size:0.75rem;font-weight:700;color:inherit">
          ${label}
        </div>
        <div style="display:flex;align-items:center;gap:0.4rem">
          <input type="date" name="deemedDate_${val}" class="bank-field-input" style="padding:0.15rem 0.35rem;font-size:0.7rem;width:120px" title="Bill / Document Issue Date">
          <button type="button" class="btn btn-outline btn-sm no-print" onclick="document.getElementById('file-deemed-${val}').click()" style="padding:0.2rem 0.5rem;font-size:0.7rem">Upload Certified Copy</button>
          <input type="file" id="file-deemed-${val}" accept="image/*,application/pdf" style="display:none" onchange="handleGenericFileUpload(this, 'deemed-status-${val}')">
          <span id="deemed-status-${val}" style="font-size:0.7rem;color:var(--text-muted);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">No file</span>
        </div>
      </div>
    `;
  });

  list.innerHTML = html;
  container.style.display = 'block';
  debounceSaveDraft();
}

// ----------------------------------------------------------------- DEMANDED KYC DOCUMENTS CHECKLIST (Item 12)
function updateDemandedDocsChecklist(type) {
  const banner = document.getElementById('demanded-docs-banner');
  const titleEl = document.getElementById('demanded-account-title');
  const listEl = document.getElementById('demanded-docs-checklist');
  if (!banner || !listEl) return;

  const titleMap = {
    'SAVINGS': 'High-Yield Savings Bank Account',
    'CHECKING': 'Everyday Current & Checking Account',
    'SALARY': 'Corporate Salary Account',
    'FIXED_DEPOSIT': 'Fixed / Term Deposit Account',
    'MONEY_MARKET': 'Money Market / Recurring Deposit Account',
    'NRI_EXPAT': 'NRI / Foreign Expat Global Account',
    'STUDENT': 'Campus Student Advantage Account',
    'PENSION': 'Pension Savings Account'
  };

  const docsMap = {
    'SAVINGS': ['Proof of Identity (Passport, Aadhaar, Voter ID)', 'Proof of Address (Utility Bill, Council Tax)', 'PAN Card or Form 60'],
    'CHECKING': ['Proof of Identity (Passport, Driving License)', 'Business / Residential Address Proof', 'PAN Card'],
    'SALARY': ['Proof of Identity (Passport / Aadhaar)', 'Corporate Salary Payslip / Employee ID', 'PAN Card'],
    'FIXED_DEPOSIT': ['Proof of Identity (Passport, Aadhaar)', 'Proof of Address', 'Source of Funds Verification Statement', 'PAN Card'],
    'MONEY_MARKET': ['Proof of Identity', 'Proof of Address & Liquidity', 'PAN Card'],
    'NRI_EXPAT': ['Valid Passport & Overseas Work Visa / Residence Permit', 'Overseas Residential Address Proof', 'FATCA / CRS Declaration', 'Tax ID / PAN'],
    'STUDENT': ['Student Identity Card / University Acceptance Letter', 'Proof of Identity (Passport / Aadhaar)', 'Proof of Residence / Dormitory'],
    'PENSION': ['Proof of Identity & Age (Aadhaar, Passport)', 'Pension Payment Order (PPO) / Disability UDID Card', 'Proof of Address']
  };

  const accountTitle = titleMap[type] || 'Resident Individual Account';
  if (titleEl) titleEl.textContent = accountTitle;

  const docs = docsMap[type] || ['Proof of Identity', 'Proof of Address', 'PAN Card'];
  listEl.innerHTML = docs.map(d => `
    <span style="background:rgba(255,255,255,0.04);border:1px solid var(--border-subtle);padding:0.25rem 0.55rem;border-radius:4px;display:flex;align-items:center;gap:4px">
      <span style="color:var(--brand-500)">✓</span> ${d}
    </span>
  `).join('');
}

// ----------------------------------------------------------------- JOINT MEMBERS SCALING (Items 15 & 16)
function changeJointMembersCount(delta) {
  const input = document.getElementById('input-joint-members-count');
  if (!input) return;
  let val = parseInt(input.value || 2, 10) + delta;
  val = Math.max(2, Math.min(10, val));
  input.value = val;
  setJointMembersCount(val);
}

function setJointMembersCount(count) {
  const n = Math.max(2, Math.min(10, parseInt(count) || 2));
  const countInp = document.getElementById('input-joint-members-count');
  if (countInp && parseInt(countInp.value) !== n) countInp.value = n;

  // 1. Part I: Comprehensive Personal Information Sections for Applicants 2..N (Full Parity with Applicant 1)
  const part1Container = document.getElementById('joint-applicants-part1-container');
  if (part1Container) {
    let p1Html = '';
    for (let i = 2; i <= n; i++) {
      const suffix = (i === 2) ? '2nd' : (i === 3) ? '3rd' : `${i}th`;
      p1Html += `
        <div class="joint-applicant-comprehensive-card" style="margin-top:1.5rem;padding:1.25rem;border:1px solid var(--border-subtle);border-radius:10px;background:rgba(255,255,255,0.015)">
          <div class="bank-section-bar" style="margin-bottom:1rem">
            <span>${suffix} Joint Applicant Details • Co-Applicant #${i} (Same as ID Proof)</span>
            <span class="oac-s122">Direct Box Input • Block Letters</span>
          </div>

          <!-- Full Name Prefix -->
          <div class="oac-s123">
            <span class="oac-s124" id="label-joint${i}-name-prefix">Full Name* (Prefix):</span>
            <label class="bank-option-pill"><input type="radio" name="joint${i}Prefix" value="Mr." checked> <span>Mr.</span></label>
            <label class="bank-option-pill"><input type="radio" name="joint${i}Prefix" value="Mrs."> <span>Mrs.</span></label>
            <label class="bank-option-pill"><input type="radio" name="joint${i}Prefix" value="Ms."> <span>Ms.</span></label>
            <label class="bank-option-pill"><input type="radio" name="joint${i}Prefix" value="Dr."> <span>Dr.</span></label>
            <label class="bank-option-pill"><input type="radio" name="joint${i}Prefix" value="Prof."> <span>Prof.</span></label>
            <label class="bank-option-pill"><input type="radio" name="joint${i}Prefix" value="Other"> <span>Other</span></label>
          </div>

          <!-- First Name Direct Box Input -->
          <div class="char-input-group">
            <div class="char-input-label-row">
              <span>First Name*:</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-first-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}FirstName">
              <input type="text" id="raw-joint${i}-first-name" name="joint${i}FirstName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false" required oninput="syncJointApplicantName(${i})">
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Middle Name Direct Box Input (Standard Optional Input, No Toggle) -->
          <div class="char-input-group">
            <div class="char-input-label-row">
              <span>Middle Name:</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-middle-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}MiddleName">
              <input type="text" id="raw-joint${i}-middle-name" name="joint${i}MiddleName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false" oninput="syncJointApplicantName(${i})">
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Last Name Direct Box Input -->
          <div class="char-input-group">
            <div class="char-input-label-row">
              <span>Last Name*:</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-last-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}LastName">
              <input type="text" id="raw-joint${i}-last-name" name="joint${i}LastName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false" required oninput="syncJointApplicantName(${i})">
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Previous Name / Name Before Marriage (if any) -->
          <div class="char-input-group">
            <div class="char-input-label-row">
              <span>Previous Name / Name Before Marriage (if any):</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-previous-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}PreviousName">
              <input type="text" id="raw-joint${i}-previous-name" name="joint${i}PreviousName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false">
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Comprehensive Demographics Grid: Relationship, DOB with Calendar Picker, Gender, Marital, Nationality -->
          <div class="oac-s128" style="margin-top:0.75rem">
            <!-- Mandatory Relationship with Primary* (Requirement 4) -->
            <div>
              <label class="oac-s131" id="label-joint${i}-relationship">Relationship with Primary*:</label>
              <select name="joint${i}Relationship" id="select-joint${i}-relationship" class="bank-field-input" style="height:42px;font-size:0.85rem;font-weight:600" required>
                <option value="" disabled selected>Select Relationship*</option>
                <option value="Spouse">Spouse</option>
                <option value="Son / Daughter">Son / Daughter</option>
                <option value="Parent">Parent</option>
                <option value="Business Partner">Business Partner</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Date of Birth with Calendar SVG Button Trigger (Requirement 5) -->
            <div>
              <div class="oac-s106">
                <label class="oac-s129" id="label-joint${i}-dob">Date of Birth* (DD/MM/YYYY):</label>
                <button type="button" class="btn btn-outline btn-sm no-print oac-s107" onclick="document.getElementById('picker-joint${i}-dob-date').showPicker ? document.getElementById('picker-joint${i}-dob-date').showPicker() : document.getElementById('picker-joint${i}-dob-date').focus()" title="Choose Date of Birth">
                  <svg class="oac-s108" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </button>
                <input class="oac-s109" type="date" id="picker-joint${i}-dob-date" tabindex="-1" onchange="setDateFromPicker(this.value, 'raw-joint${i}-dob-date', 'wrap-joint${i}-dob-date')">
              </div>
              <div class="bank-box-wrap notranslate" translate="no" id="wrap-joint${i}-dob-date" data-box-count="8" data-target="joint${i}Dob">
                <input type="text" id="raw-joint${i}-dob-date" name="joint${i}Dob" class="bank-box-input notranslate" translate="no" maxlength="8" autocomplete="off" spellcheck="false" required>
                <div class="bank-box-cells notranslate oac-s110" translate="no">
                  <span class="char-cell" data-idx="0">&nbsp;</span>
                  <span class="char-cell" data-idx="1">&nbsp;</span>
                  <span class="date-separator">/</span>
                  <span class="char-cell" data-idx="2">&nbsp;</span>
                  <span class="char-cell" data-idx="3">&nbsp;</span>
                  <span class="date-separator">/</span>
                  <span class="char-cell" data-idx="4">&nbsp;</span>
                  <span class="char-cell" data-idx="5">&nbsp;</span>
                  <span class="char-cell" data-idx="6">&nbsp;</span>
                  <span class="char-cell" data-idx="7">&nbsp;</span>
                </div>
              </div>
            </div>

            <div>
              <label class="oac-s131">Gender*:</label>
              <div class="oac-s132">
                <label class="bank-option-pill"><input type="radio" name="joint${i}Gender" value="MALE" checked> <span>Male</span></label>
                <label class="bank-option-pill"><input type="radio" name="joint${i}Gender" value="FEMALE"> <span>Female</span></label>
                <label class="bank-option-pill"><input type="radio" name="joint${i}Gender" value="TRANSGENDER"> <span>Transgender</span></label>
              </div>
            </div>

            <div>
              <label class="oac-s131">Marital Status*:</label>
              <div class="oac-s132">
                <label class="bank-option-pill"><input type="radio" name="joint${i}Marital" value="MARRIED" checked> <span>Married</span></label>
                <label class="bank-option-pill"><input type="radio" name="joint${i}Marital" value="UNMARRIED"> <span>Unmarried</span></label>
                <label class="bank-option-pill"><input type="radio" name="joint${i}Marital" value="OTHERS"> <span>Others</span></label>
              </div>
            </div>

            <div>
              <label class="oac-s131">Nationality*:</label>
              <div class="oac-s132">
                <label class="bank-option-pill"><input type="radio" name="joint${i}Nationality" value="IN" checked> <span>IN - Indian</span></label>
                <label class="bank-option-pill"><input type="radio" name="joint${i}Nationality" value="OTHERS"> <span>Others</span></label>
              </div>
            </div>
          </div>

          <!-- Father's Name Direct Box Input -->
          <div class="char-input-group" style="margin-top:0.75rem">
            <div class="char-input-label-row">
              <span>Father's Name*:</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-father-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}FatherName">
              <input type="text" id="raw-joint${i}-father-name" name="joint${i}FatherName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false" required>
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Mother's Name Direct Box Input -->
          <div class="char-input-group">
            <div class="char-input-label-row">
              <span>Mother's Name*:</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-mother-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}MotherName">
              <input type="text" id="raw-joint${i}-mother-name" name="joint${i}MotherName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false" required>
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Spouse Name (if married) Direct Box Input -->
          <div class="char-input-group">
            <div class="char-input-label-row">
              <span>Spouse Name (if married):</span>
              <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-spouse-name">
                <span class="char-limit-text">Max 50 chars • Boxes expand as you type</span>
                <span class="char-limit-counter"><span class="char-count-current">0</span>/50</span>
              </span>
            </div>
            <div class="bank-box-wrap notranslate" translate="no" data-box-count="24" data-target="joint${i}SpouseName">
              <input type="text" id="raw-joint${i}-spouse-name" name="joint${i}SpouseName" class="bank-box-input notranslate" translate="no" maxlength="50" autocomplete="off" spellcheck="false">
              <div class="bank-box-cells notranslate" translate="no"></div>
            </div>
          </div>

          <!-- Tax ID (PAN) & Aadhaar Box Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-top:0.75rem">
            <div class="char-input-group">
              <div class="char-input-label-row">
                <span>PAN Number*:</span>
                <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-pan-number">
                  <span class="char-limit-counter"><span class="char-count-current">0</span>/10</span>
                </span>
              </div>
              <div class="bank-box-wrap notranslate" translate="no" data-box-count="10" data-target="joint${i}Pan">
                <input type="text" id="raw-joint${i}-pan-number" name="joint${i}Pan" class="bank-box-input notranslate" translate="no" maxlength="10" autocomplete="off" spellcheck="false" required>
                <div class="bank-box-cells notranslate" translate="no"></div>
              </div>
            </div>

            <div class="char-input-group">
              <div class="char-input-label-row">
                <span>Aadhaar Number*:</span>
                <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-aadhaar-number">
                  <span class="char-limit-counter"><span class="char-count-current">0</span>/12</span>
                </span>
              </div>
              <div class="bank-box-wrap notranslate" translate="no" data-box-count="12" data-target="joint${i}Aadhaar">
                <input type="text" id="raw-joint${i}-aadhaar-number" name="joint${i}Aadhaar" class="bank-box-input notranslate" translate="no" maxlength="12" autocomplete="off" spellcheck="false" required>
                <div class="bank-box-cells notranslate" translate="no"></div>
              </div>
            </div>
          </div>

          <!-- Mobile & Email Contact Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;margin-top:0.75rem">
            <div class="char-input-group">
              <div class="char-input-label-row">
                <span>Mobile Number*:</span>
                <span class="char-box-limit-hint notranslate" translate="no" data-target-input="raw-joint${i}-mobile-number">
                  <span class="char-limit-counter"><span class="char-count-current">0</span>/10</span>
                </span>
              </div>
              <div class="bank-box-wrap notranslate" translate="no" data-box-count="10" data-target="joint${i}Mobile">
                <input type="text" id="raw-joint${i}-mobile-number" name="joint${i}Phone" class="bank-box-input notranslate" translate="no" maxlength="10" autocomplete="off" spellcheck="false" required>
                <div class="bank-box-cells notranslate" translate="no"></div>
              </div>
            </div>

            <div>
              <label class="oac-s131">Email Address:</label>
              <input type="email" id="joint${i}-email" name="joint${i}Email" class="bank-field-input" placeholder="applicant${i}@example.com" style="height:42px;margin-top:0.35rem">
            </div>
          </div>
        </div>
      `;
    }
    part1Container.innerHTML = p1Html;
    part1Container.style.display = 'block';

    // Initialize segmented character boxes for all dynamically mounted applicant inputs
    if (typeof window.initBankBoxInputs === 'function') {
      window.initBankBoxInputs();
    }
  }

  // 2. Section 7: Scalable Photo and Signature Uploads for Applicants 2..N (Exact UI Parity with Applicant 1)
  const sec7JointContainer = document.getElementById('joint-photos-signatures-dynamic');
  if (sec7JointContainer) {
    let s7Html = '';
    for (let i = 2; i <= n; i++) {
      const suffix = (i === 2) ? '2nd' : (i === 3) ? '3rd' : `${i}th`;
      s7Html += `
        <div class="applicant-photo-sig-pair oac-s241" id="photo-sig-pair-applicant-${i}" style="margin-top:1rem">
          <!-- PASSPORT PHOTO UPLOAD (Auto-Resized to 3.5cm x 4.5cm) -->
          <div class="oac-s214">
            <div class="oac-s242">
              ${suffix} Applicant Photo
            </div>
            
            <div class="passport-photo-box" id="joint${i}-photo-box" onclick="document.getElementById('input-joint${i}-photo-file').click()" title="Click to upload photograph (auto-resized)">
              <div id="joint${i}-photo-placeholder">
                <div class="oac-s243"></div>
                <div class="oac-s244">Upload Photo</div>
                <div class="oac-s245">
                  3.5cm × 4.5cm
                </div>
              </div>
              <img id="joint${i}-photo-img" class="passport-photo-img" style="display:none" alt="${suffix} Photograph">
              <span id="joint${i}-photo-stamp-badge" class="passport-stamp-badge" style="display:none">PHOTO ✓</span>
            </div>

            <input class="oac-s159" type="file" id="input-joint${i}-photo-file" accept="image/*" onchange="handlePassportPhotoUpload(this, ${i})">
            <input type="hidden" name="joint${i}PhotoData" id="input-joint${i}-photo-data">

            <div class="oac-s246">
              (Paste cleanly. Do not staple)
            </div>
          </div>

          <!-- SIGNATURE / THUMB IMPRESSION VERIFICATION SLOT (Parity with Applicant 1) -->
          <div class="oac-s247">
            <div class="oac-s242">
              Signature / Thumb (${suffix} Applicant)
            </div>

            <div id="slot-joint${i}-signature" class="verification-slot-box" onclick="openVerificationChoiceModal(${i})" title="Click to choose Digital Signature Pad or Upload Thumb Impression">
              <div id="joint${i}-signature-placeholder">
                <div class="oac-s248">
                  <svg class="oac-s249" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  <svg class="oac-s250" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </div>
                <div class="oac-s251">Tap to Sign &amp; Verify</div>
                <div class="oac-s252">Digital Pad or Biometric Thumb Impression</div>
              </div>
              <img id="joint${i}-signature-preview" class="form-signature-preview" style="display:none" alt="${suffix} Specimen Verification">
              <div id="joint${i}-signature-meta" class="form-signature-meta" style="display:none"></div>
            </div>

            <input type="hidden" name="joint${i}SignatureData" id="input-joint${i}-signature-data">
            <input type="hidden" name="joint${i}ThumbData" id="input-joint${i}-thumb-data">

            <div class="oac-s253">
              <div class="oac-s254">
                <span>Specimen Record</span>
                <span>•</span>
                <span>Biometric Vault</span>
              </div>
              <button type="button" class="btn btn-outline btn-sm no-print oac-s255" onclick="openVerificationChoiceModal(${i})" title="Change or re-sign verification">Change</button>
            </div>
          </div>
        </div>
      `;
    }
    sec7JointContainer.innerHTML = s7Html;
    sec7JointContainer.style.display = 'block';
  }

  // 3. Part II Section 6: Table Rows for Applicants 2..N
  const tbodyPart2 = document.getElementById('tbody-joint-applicants-part2');
  if (tbodyPart2) {
    let rowsHtml = `
      <tr>
        <td><strong>1st Applicant</strong></td>
        <td><span id="joint-primary-name" style="font-weight:700">${(window.escapeHtml || (s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))))(syncApplicantFullName())}</span></td>
        <td><span style="font-family:monospace">AS PER PART-I</span></td>
        <td style="text-align:center" id="joint-primary-signature-slot">
          <div id="joint-primary-sig-preview" style="height:40px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.7rem">
            (Primary Specimen)
          </div>
        </td>
      </tr>
    `;
    for (let i = 2; i <= n; i++) {
      const suffix = (i === 2) ? '2nd' : (i === 3) ? '3rd' : `${i}th`;
      rowsHtml += `
        <tr id="row-joint-part2-${i}">
          <td><strong>${suffix} Applicant</strong></td>
          <td><span id="joint${i}-table-name" style="font-weight:700">Co-Applicant #${i}</span></td>
          <td><span id="joint${i}-table-cif" style="font-family:monospace">AS PER PART-I</span></td>
          <td style="text-align:center" id="joint${i}-table-signature-slot">
            <div style="font-size:0.7rem;color:var(--text-muted);display:flex;align-items:center;justify-content:center;gap:4px">
              <span>(Specimen Slot)</span>
              <button type="button" class="btn btn-outline btn-sm no-print" onclick="openCoSignModal('joint${i}')" style="padding:0.15rem 0.35rem;font-size:0.62rem"></button>
            </div>
          </td>
        </tr>
      `;
    }
    tbodyPart2.innerHTML = rowsHtml;
    const secJoint = document.getElementById('section-joint-applicant-details');
    if (secJoint) secJoint.style.display = 'block';
  }

  // 4. Part III Section 3: Final Declaration Signatures for Applicants 1..N
  const part3Container = document.getElementById('part3-signatures-container');
  if (part3Container) {
    let p3Html = `
      <div style="border:1px dashed var(--border-subtle);padding:0.75rem;text-align:center;border-radius:4px">
        <div id="part3-sig1-preview" style="height:50px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.75rem">
          (Primary Specimen)
        </div>
        <div style="border-top:1px solid var(--text-main);margin-top:0.4rem;padding-top:0.25rem;font-size:0.72rem;font-weight:700">
          Signature / LTI of 1st Applicant
        </div>
      </div>
    `;
    for (let i = 2; i <= n; i++) {
      const suffix = (i === 2) ? '2nd' : (i === 3) ? '3rd' : `${i}th`;
      p3Html += `
        <div style="border:1px dashed var(--border-subtle);padding:0.75rem;text-align:center;border-radius:4px" id="part3-sig-box-${i}">
          <div id="part3-sig${i}-preview" style="height:50px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.75rem">
            (Specimen Slot)
          </div>
          <div style="border-top:1px solid var(--text-main);margin-top:0.4rem;padding-top:0.25rem;font-size:0.72rem;font-weight:700">
            Signature of ${suffix} Applicant
          </div>
        </div>
      `;
    }
    p3Html += `
      <div style="border:1px dashed var(--border-subtle);padding:0.75rem;text-align:center;border-radius:4px">
        <div id="part3-sig3-preview" style="height:50px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.75rem">
          (Witness / Guardian)
        </div>
        <div style="border-top:1px solid var(--text-main);margin-top:0.4rem;padding-top:0.25rem;font-size:0.72rem;font-weight:700">
          Signature of Guardian / Witness
        </div>
      </div>
    `;
    part3Container.innerHTML = p3Html;
  }
}

function syncJointApplicantName(i) {
  const f = document.getElementById(`raw-joint${i}-first-name`)?.value.trim() || '';
  const m = document.getElementById(`raw-joint${i}-middle-name`)?.value.trim() || '';
  const l = document.getElementById(`raw-joint${i}-last-name`)?.value.trim() || '';
  const fullName = [f, m, l].filter(Boolean).join(' ').toUpperCase() || `CO-APPLICANT #${i}`;

  const tName = document.getElementById(`joint${i}-table-name`);
  if (tName) tName.textContent = fullName;
  debounceSaveDraft();
}

function handleJointPassportPhotoUpload(input, idx) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById(`joint${idx}-photo-img`);
    const placeholder = document.getElementById(`joint${idx}-photo-placeholder`);
    const hidden = document.getElementById(`input-joint${idx}-photo-data`);
    if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    if (hidden) hidden.value = e.target.result;
    showToast(`Applicant #${idx} photograph attached.`, 'success');
    debounceSaveDraft();
  };
  reader.readAsDataURL(file);
}

function openThumbUploadModalFor(target = 'primary') {
  currentSigningTarget = target;
  openThumbUploadModal();
}

// ----------------------------------------------------------------- JOINT APPLICANT VISIBILITY & MODE
function updateJointApplicantVisibility() {
  const modeRadio = document.querySelector('input[name="modeOperationRadio"]:checked');
  const modeVal = modeRadio ? modeRadio.value : 'SELF_SINGLE';
  handleModeOperationChange(modeVal);
}

function handleModeOperationChange(modeVal) {
  const jointCountRow = document.getElementById('joint-members-count-row');
  const jointSection = document.getElementById('section-joint-applicant-details');
  const part1Joint = document.getElementById('joint-applicants-part1-container');
  const sec7Joint = document.getElementById('joint-photos-signatures-dynamic');

  if (modeVal === 'JOINTLY') {
    if (jointCountRow) jointCountRow.style.display = 'flex';
    const count = parseInt(document.getElementById('input-joint-members-count')?.value || 2, 10);
    setJointMembersCount(count);
  } else {
    if (jointCountRow) jointCountRow.style.display = 'none';
    if (jointSection) jointSection.style.display = 'none';
    if (part1Joint) part1Joint.style.display = 'none';
    if (sec7Joint) sec7Joint.style.display = 'none';
  }
  debounceSaveDraft();
}

// ----------------------------------------------------------------- INITIAL DEPOSIT PAYMENT DETAILS (Item 18)
function handlePaymentModeChange(mode) {
  const chequeDiv = document.getElementById('paymode-fields-cheque');
  const cashDiv = document.getElementById('paymode-fields-cash');
  const transferDiv = document.getElementById('paymode-fields-transfer');

  if (chequeDiv) chequeDiv.style.display = (mode === 'Cheque / DD') ? 'grid' : 'none';
  if (cashDiv) cashDiv.style.display = (mode === 'Cash') ? 'grid' : 'none';
  if (transferDiv) transferDiv.style.display = (mode === 'Transfer from Existing Account') ? 'grid' : 'none';

  debounceSaveDraft();
}

function convertNumberToWords(amount) {
  const num = Math.floor(parseFloat(amount) || 0);
  if (num <= 0) return '';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ((n % 10 !== 0) ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + ((n % 100 !== 0) ? 'and ' + numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + ((n % 1000 !== 0) ? numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + ((n % 100000 !== 0) ? numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + 'Crore ' + ((n % 10000000 !== 0) ? numToWords(n % 10000000) : '');
  }

  return numToWords(num).trim() + ' Rupees Only';
}

function handleDepositAmountInput(val) {
  const wordsInp = document.getElementById('input-deposit-words');
  if (wordsInp && val) {
    wordsInp.value = convertNumberToWords(val);
  }
}

function syncSelectedProductFromPart2(type) {
  selectAccountType(type);
  updateJointApplicantVisibility();
}

// ----------------------------------------------------------------- PASSPORT PHOTO CROP & RESIZE
function handlePassportPhotoUpload(input, applicantNum = 1) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      // 3.5cm x 4.5cm standard passport aspect ratio (350px x 450px)
      const targetW = 350;
      const targetH = 450;
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      const imgRatio = img.width / img.height;
      const targetRatio = targetW / targetH;
      let sWidth, sHeight, sx, sy;

      if (imgRatio > targetRatio) {
        sHeight = img.height;
        sWidth = img.height * targetRatio;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = img.width / targetRatio;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      ctx.fillStyle = 'var(--text-contrast)';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);

      const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      const isPrimary = (applicantNum === 1 || applicantNum === 'primary');
      const previewImg = isPrimary ? document.getElementById('passport-photo-img') : document.getElementById(`joint${applicantNum}-photo-img`);
      const placeholder = isPrimary ? document.getElementById('passport-photo-placeholder') : document.getElementById(`joint${applicantNum}-photo-placeholder`);
      const stampBadge = isPrimary ? document.getElementById('passport-stamp-badge') : document.getElementById(`joint${applicantNum}-photo-stamp-badge`);
      const hiddenInput = isPrimary ? document.getElementById('input-applicant-photo-data') : document.getElementById(`input-joint${applicantNum}-photo-data`);

      if (previewImg) {
        previewImg.src = resizedDataUrl;
        previewImg.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
      if (stampBadge) stampBadge.style.display = 'block';
      if (hiddenInput) hiddenInput.value = resizedDataUrl;

      showToast(`Applicant ${isPrimary ? '1' : '#' + applicantNum} photograph resized cleanly to 3.5cm x 4.5cm.`, 'success');
      debounceSaveDraft();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ----------------------------------------------------------------- VERIFICATION CHOICE MODAL (Item 10)
let currentVerificationApplicantIdx = 1;

function openVerificationChoiceModal(applicantIdx = 1) {
  currentVerificationApplicantIdx = applicantIdx;
  currentSigningTarget = (applicantIdx === 1 || applicantIdx === 'primary') ? 'primary' : `joint${applicantIdx}`;
  const modal = document.getElementById('modal-verification-choice');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.scrollTop = 0;
  if (document.body) document.body.classList.add('modal-open');
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeVerificationChoiceModal() {
  const modal = document.getElementById('modal-verification-choice');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    const remaining = document.querySelectorAll('.modal-overlay.active, .signature-modal-backdrop.active, .db-modal-overlay.active');
    if (remaining.length === 0 && document.body) document.body.classList.remove('modal-open');
  }, 200);
}

function selectVerificationMethod(method) {
  closeVerificationChoiceModal();
  if (method === 'SIGNATURE') {
    setTimeout(() => openCoSignModal(currentSigningTarget), 210);
  } else if (method === 'THUMB') {
    setTimeout(openThumbUploadModal, 210);
  }
}

// ----------------------------------------------------------------- THUMB IMPRESSION UPLOAD MODAL (Item 10)
function openThumbUploadModal() {
  const modal = document.getElementById('modal-thumb-upload');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.scrollTop = 0;
  if (document.body) document.body.classList.add('modal-open');
  setTimeout(() => modal.classList.add('active'), 10);
}

function closeThumbUploadModal() {
  const modal = document.getElementById('modal-thumb-upload');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    const remaining = document.querySelectorAll('.modal-overlay.active, .signature-modal-backdrop.active, .db-modal-overlay.active');
    if (remaining.length === 0 && document.body) document.body.classList.remove('modal-open');
  }, 200);
}

function handleThumbPhotoSelected(input) {
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];

  const reader = new FileReader();
  reader.onload = function(e) {
    currentUploadedThumbData = e.target.result;
    const previewEl = document.getElementById('thumb-preview-img');
    const dropzoneEmpty = document.getElementById('thumb-dropzone-empty');
    const dropzonePreview = document.getElementById('thumb-dropzone-preview');

    if (previewEl) previewEl.src = currentUploadedThumbData;
    if (dropzoneEmpty) dropzoneEmpty.style.display = 'none';
    if (dropzonePreview) dropzonePreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveThumbImpression() {
  if (!currentUploadedThumbData) {
    showToast('Please select or upload a thumb impression photo first.', 'info');
    return;
  }

  const isPrimary = (currentVerificationApplicantIdx === 1 || currentSigningTarget === 'primary');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  if (isPrimary) {
    const previewImg = document.getElementById('form-signature-preview');
    const placeholder = document.getElementById('form-signature-placeholder');
    const metaContainer = document.getElementById('form-signature-meta');
    const hiddenThumb = document.getElementById('input-applicant-thumb-data');
    const hiddenSig = document.getElementById('input-applicant-signature-data');

    if (previewImg) {
      previewImg.src = currentUploadedThumbData;
      previewImg.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';

    const fullName = syncApplicantFullName();
    if (metaContainer) {
      metaContainer.style.display = 'block';
      metaContainer.innerHTML = `
        <div style="font-weight:800;color:var(--emerald-400);font-size:0.75rem">${fullName}</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Date: ${dateStr} • Biometric Thumb Verified ✓</div>
      `;
    }

    if (hiddenThumb) hiddenThumb.value = currentUploadedThumbData;
    if (hiddenSig) hiddenSig.value = ''; // Marked as thumb impression

    // Sync into Part-III preview
    const part3Sig = document.getElementById('part3-sig1-preview');
    if (part3Sig) {
      part3Sig.innerHTML = `<img src="${currentUploadedThumbData}" style="max-height:45px;max-width:100%;object-fit:contain"><br><span style="font-size:0.65rem;color:var(--emerald-400);font-weight:700">Thumb Verified</span>`;
    }

    // Sync into Part-II Joint Table primary slot
    const jointPrimarySlot = document.getElementById('joint-primary-signature-slot');
    if (jointPrimarySlot) {
      jointPrimarySlot.innerHTML = `<img src="${currentUploadedThumbData}" style="max-height:36px;max-width:110px;object-fit:contain;background:rgba(255,255,255,0.9);padding:2px 4px;border-radius:4px;border:1px solid var(--border-subtle)" alt="Primary Thumb"><br><span style="font-size:0.65rem;color:var(--emerald-400);font-weight:700">✓ Biometric Thumb</span>`;
    }
  } else {
    const idx = currentVerificationApplicantIdx || parseInt(currentSigningTarget.replace('joint', '')) || 2;
    const previewImg = document.getElementById(`joint${idx}-signature-preview`);
    const placeholder = document.getElementById(`joint${idx}-signature-placeholder`);
    const metaContainer = document.getElementById(`joint${idx}-signature-meta`);
    const hiddenThumb = document.getElementById(`input-joint${idx}-thumb-data`);
    const hiddenSig = document.getElementById(`input-joint${idx}-signature-data`);

    if (previewImg) {
      previewImg.src = currentUploadedThumbData;
      previewImg.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';

    const f = document.getElementById(`raw-joint${idx}-first-name`)?.value.trim() || '';
    const l = document.getElementById(`raw-joint${idx}-last-name`)?.value.trim() || '';
    const jName = [f, l].filter(Boolean).join(' ').toUpperCase() || `CO-APPLICANT #${idx}`;

    if (metaContainer) {
      metaContainer.style.display = 'block';
      metaContainer.innerHTML = `
        <div style="font-weight:800;color:var(--emerald-400);font-size:0.75rem">${jName}</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Date: ${dateStr} • Biometric Thumb Verified ✓</div>
      `;
    }

    if (hiddenThumb) hiddenThumb.value = currentUploadedThumbData;
    if (hiddenSig) hiddenSig.value = '';

    const part3Sig = document.getElementById(`part3-sig${idx}-preview`);
    if (part3Sig) {
      part3Sig.innerHTML = `<img src="${currentUploadedThumbData}" style="max-height:45px;max-width:100%;object-fit:contain"><br><span style="font-size:0.65rem;color:var(--emerald-400);font-weight:700">${jName} Thumb Verified</span>`;
    }

    const tableSlot = document.getElementById(`joint${idx}-table-signature-slot`) || document.getElementById(`joint${idx}-signature-slot`);
    if (tableSlot) {
      tableSlot.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:6px">
          <img src="${currentUploadedThumbData}" style="max-height:36px;max-width:110px;object-fit:contain;background:rgba(255,255,255,0.9);padding:2px 4px;border-radius:4px;border:1px solid var(--border-subtle)" alt="Co-Sign ${idx}">
          <span style="font-size:0.68rem;color:var(--emerald-400);font-weight:700">✓ Thumb Verified</span>
        </div>
      `;
    }
  }

  closeThumbUploadModal();
  showToast('Thumb impression placed on bank application form.', 'success');
  debounceSaveDraft();
}

// ----------------------------------------------------------------- DIGITAL SPECIMEN SIGNATURE & CO-SIGN MODAL (Items 15 & 16)
let currentSigningTarget = 'primary'; // 'primary' | 'joint2' | 'joint3'

function openSignatureModal() {
  openCoSignModal('primary');
}

function openCoSignModal(applicantTarget = 'primary') {
  currentSigningTarget = applicantTarget;
  const modal = document.getElementById('modal-signature-pad');
  if (!modal) return;

  let signerName = '';
  if (applicantTarget.startsWith('joint')) {
    const idx = parseInt(applicantTarget.replace('joint', '')) || 2;
    const f = document.getElementById(`raw-joint${idx}-first-name`)?.value.trim() || '';
    const l = document.getElementById(`raw-joint${idx}-last-name`)?.value.trim() || '';
    signerName = [f, l].filter(Boolean).join(' ').toUpperCase() || `CO-APPLICANT #${idx}`;
  } else {
    signerName = syncApplicantFullName();
  }

  const signAsEl = document.getElementById('signature-modal-sign-as');
  if (signAsEl) {
    signAsEl.innerHTML = `Sign as: <strong style="color:var(--brand-500);letter-spacing:0.04em">${signerName}</strong>`;
  }

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
                  now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const timeEl = document.getElementById('signature-modal-timestamp');
  if (timeEl) {
    timeEl.textContent = `Date & Time: ${timeStr} • Verified Digital Specimen`;
  }

  modal.style.display = 'flex';
  modal.scrollTop = 0;
  if (document.body) document.body.classList.add('modal-open');
  setTimeout(() => modal.classList.add('active'), 10);
  initSignaturePadCanvas();
}

function closeSignatureModal() {
  const modal = document.getElementById('modal-signature-pad');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    const remaining = document.querySelectorAll('.modal-overlay.active, .signature-modal-backdrop.active, .db-modal-overlay.active');
    if (remaining.length === 0 && document.body) document.body.classList.remove('modal-open');
  }, 200);
}

function initSignaturePadCanvas() {
  const canvas = document.getElementById('signature-pad-canvas');
  if (!canvas) return;

  const wrap = canvas.parentElement;
  const rect = wrap.getBoundingClientRect();
  const width = Math.floor(rect.width) || 540;
  const height = 200;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = signaturePadState.lineWidth;
  ctx.strokeStyle = signaturePadState.penColor;

  signaturePadState.canvas = canvas;
  signaturePadState.ctx = ctx;
  signaturePadState.isDrawing = false;
  signaturePadState.hasSignature = false;

  canvas.onmousedown = (e) => startSignatureStroke(e.offsetX, e.offsetY);
  canvas.onmousemove = (e) => continueSignatureStroke(e.offsetX, e.offsetY);
  canvas.onmouseup = () => stopSignatureStroke();
  canvas.onmouseleave = () => stopSignatureStroke();

  canvas.ontouchstart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const cRect = canvas.getBoundingClientRect();
    startSignatureStroke(touch.clientX - cRect.left, touch.clientY - cRect.top);
  };
  canvas.ontouchmove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const cRect = canvas.getBoundingClientRect();
    continueSignatureStroke(touch.clientX - cRect.left, touch.clientY - cRect.top);
  };
  canvas.ontouchend = (e) => {
    e.preventDefault();
    stopSignatureStroke();
  };
}

function startSignatureStroke(x, y) {
  signaturePadState.isDrawing = true;
  signaturePadState.lastX = x;
  signaturePadState.lastY = y;
}

function continueSignatureStroke(x, y) {
  if (!signaturePadState.isDrawing || !signaturePadState.ctx) return;
  const ctx = signaturePadState.ctx;
  ctx.beginPath();
  ctx.moveTo(signaturePadState.lastX, signaturePadState.lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  signaturePadState.lastX = x;
  signaturePadState.lastY = y;
  signaturePadState.hasSignature = true;
}

function stopSignatureStroke() {
  signaturePadState.isDrawing = false;
}

function clearSignaturePad() {
  if (!signaturePadState.canvas || !signaturePadState.ctx) return;
  const dpr = window.devicePixelRatio || 1;
  signaturePadState.ctx.clearRect(0, 0, signaturePadState.canvas.width / dpr, signaturePadState.canvas.height / dpr);
  signaturePadState.hasSignature = false;
}

function setSignaturePenColor(color) {
  signaturePadState.penColor = color;
  if (signaturePadState.ctx) {
    signaturePadState.ctx.strokeStyle = color;
  }
}

function generateCursiveSignature() {
  let fullName = '';
  if (currentSigningTarget.startsWith('joint')) {
    const idx = parseInt(currentSigningTarget.replace('joint', '')) || 2;
    const f = document.getElementById(`raw-joint${idx}-first-name`)?.value.trim() || '';
    const l = document.getElementById(`raw-joint${idx}-last-name`)?.value.trim() || '';
    fullName = [f, l].filter(Boolean).join(' ') || `Co-Applicant #${idx}`;
  } else {
    fullName = syncApplicantFullName();
  }

  if (!signaturePadState.canvas || !signaturePadState.ctx) return;
  clearSignaturePad();

  const ctx = signaturePadState.ctx;
  const width = parseFloat(signaturePadState.canvas.style.width);
  const height = parseFloat(signaturePadState.canvas.style.height);

  ctx.save();
  ctx.font = 'italic 44px "Brush Script MT", "Segoe Script", "Dancing Script", cursive';
  ctx.fillStyle = signaturePadState.penColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(fullName, width / 2, height / 2 - 10);

  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = signaturePadState.penColor;
  const startX = width / 2 - (fullName.length * 10);
  const endX = width / 2 + (fullName.length * 10);
  ctx.moveTo(startX, height / 2 + 20);
  ctx.bezierCurveTo(startX + 40, height / 2 + 10, endX - 40, height / 2 + 30, endX, height / 2 + 18);
  ctx.stroke();
  ctx.restore();

  signaturePadState.hasSignature = true;
}

function saveSignatureFromPad() {
  if (!signaturePadState.hasSignature) {
    showToast('Please sign on the pad before saving.', 'info');
    return;
  }

  const dataUrl = signaturePadState.canvas.toDataURL('image/png');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (currentSigningTarget.startsWith('joint')) {
    const idx = parseInt(currentSigningTarget.replace('joint', '')) || 2;
    const hiddenInput = document.getElementById(`input-joint${idx}-signature-data`);
    if (hiddenInput) hiddenInput.value = dataUrl;
    const hiddenThumb = document.getElementById(`input-joint${idx}-thumb-data`);
    if (hiddenThumb) hiddenThumb.value = '';

    const f = document.getElementById(`raw-joint${idx}-first-name`)?.value.trim() || '';
    const l = document.getElementById(`raw-joint${idx}-last-name`)?.value.trim() || '';
    const jName = [f, l].filter(Boolean).join(' ').toUpperCase() || `CO-APPLICANT #${idx}`;

    const previewImg = document.getElementById(`joint${idx}-signature-preview`);
    const placeholder = document.getElementById(`joint${idx}-signature-placeholder`);
    const metaContainer = document.getElementById(`joint${idx}-signature-meta`);

    if (previewImg) {
      previewImg.src = dataUrl;
      previewImg.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (metaContainer) {
      metaContainer.style.display = 'block';
      metaContainer.innerHTML = `
        <div style="font-weight:800;color:var(--emerald-400);font-size:0.75rem">${jName}</div>
        <div style="font-size:0.68rem;color:var(--text-muted)">Date: ${dateStr} • Digital Signature Verified ✓</div>
      `;
    }

    // Update Section 6 Joint Table Cell
    const cell = document.getElementById(`joint${idx}-table-signature-slot`) || document.getElementById(`joint${idx}-signature-slot`);
    if (cell) {
      cell.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;gap:6px">
          <img src="${dataUrl}" style="max-height:36px;max-width:110px;object-fit:contain;background:rgba(255,255,255,0.9);padding:2px 4px;border-radius:4px;border:1px solid var(--border-subtle)" alt="Co-Sign ${idx}">
          <span style="font-size:0.68rem;color:var(--emerald-400);font-weight:700">✓ Signed</span>
          <button type="button" class="btn btn-outline btn-sm no-print" onclick="openCoSignModal('joint${idx}')" style="padding:0.15rem 0.35rem;font-size:0.62rem" title="Re-sign">Re-sign</button>
        </div>
      `;
    }

    // Render visually in Part III slot
    const part3Sig = document.getElementById(`part3-sig${idx}-preview`);
    if (part3Sig) {
      part3Sig.innerHTML = `
        <img src="${dataUrl}" style="max-height:46px;max-width:90%;object-fit:contain"><br>
        <span style="font-size:0.68rem;color:var(--emerald-400);font-weight:700">${jName} ✓</span>
      `;
    }

    closeSignatureModal();
    showToast(`Applicant #${idx} specimen signature placed successfully.`, 'success');
    debounceSaveDraft();
    return;
  }

  // Primary Applicant
  const previewImg = document.getElementById('form-signature-preview');
  const placeholder = document.getElementById('form-signature-placeholder');
  const metaContainer = document.getElementById('form-signature-meta');
  const hiddenInput = document.getElementById('input-applicant-signature-data');
  const hiddenThumb = document.getElementById('input-applicant-thumb-data');

  const fullName = syncApplicantFullName();

  if (previewImg) {
    previewImg.src = dataUrl;
    previewImg.style.display = 'block';
  }
  if (placeholder) placeholder.style.display = 'none';
  if (metaContainer) {
    metaContainer.style.display = 'block';
    metaContainer.innerHTML = `
      <div style="font-weight:800;color:var(--brand-500);font-size:0.75rem">${fullName}</div>
      <div style="font-size:0.68rem;color:var(--text-muted)">Date: ${dateStr} • Time: ${timeStr}</div>
      <div style="font-size:0.65rem;color:var(--emerald-400);font-weight:700">✓ Digital Specimen Verified</div>
    `;
  }
  if (hiddenInput) hiddenInput.value = dataUrl;
  if (hiddenThumb) hiddenThumb.value = '';

  // Visually render in Part III slot 1 (Item 15)
  const part3Sig = document.getElementById('part3-sig1-preview');
  if (part3Sig) {
    part3Sig.innerHTML = `<img src="${dataUrl}" style="max-height:46px;max-width:90%;object-fit:contain"><br><span style="font-size:0.68rem;color:var(--brand-500);font-weight:700">${fullName} ✓</span>`;
  }

  // Visually render in Part II Joint Table primary slot (Item 15)
  const jointPrimarySlot = document.getElementById('joint-primary-signature-slot');
  if (jointPrimarySlot) {
    jointPrimarySlot.innerHTML = `<img src="${dataUrl}" style="max-height:36px;max-width:110px;object-fit:contain;background:rgba(255,255,255,0.9);padding:2px 4px;border-radius:4px;border:1px solid var(--border-subtle)" alt="Primary Sig"><br><span style="font-size:0.65rem;color:var(--brand-500);font-weight:700">✓ 1st Applicant</span>`;
  }

  closeSignatureModal();
  showToast('Specimen signature placed on bank application form.', 'success');
  debounceSaveDraft();
}

// ----------------------------------------------------------------- DRAFT SAVE & RESTORE (Item 2)
// ----------------------------------------------------------------- DRAFT SAVE & RESTORE (Isolated per Application Number)
function getDraftStorageKey(appNum) {
  const num = appNum || currentApplicationNumber;
  return num ? `neobank_form_draft_${num}` : 'neobank_form_draft_default';
}

let isApplicationSubmitted = false;
let draftSaveTimeout = null;

function debounceSaveDraft() {
  if (isApplicationSubmitted || !currentApplicationNumber) return;
  if (draftSaveTimeout) clearTimeout(draftSaveTimeout);
  draftSaveTimeout = setTimeout(() => {
    if (!isApplicationSubmitted && currentApplicationNumber) {
      saveCustomerFormDraft(false);
    }
  }, 1000);
}

function extractFullFormData(form) {
  if (!form) form = document.getElementById('form-customer-application');
  if (!form) return {};

  const data = {
    applicationNumber: currentApplicationNumber,
    accountType: selectedAccountType,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    inputs: {},
    radios: {},
    checkboxes: {},
    selects: {}
  };

  // Save all inputs (including hidden & box inputs)
  form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="file"])').forEach(inp => {
    if (inp.name || inp.id) {
      const key = inp.name || inp.id;
      data.inputs[key] = inp.value;
    }
  });

  // Save radio selections
  form.querySelectorAll('input[type="radio"]:checked').forEach(r => {
    data.radios[r.name] = r.value;
  });

  // Save checkboxes
  form.querySelectorAll('input[type="checkbox"]').forEach(c => {
    if (c.name || c.id) {
      data.checkboxes[c.name || c.id] = c.checked;
    }
  });

  // Save selects
  form.querySelectorAll('select').forEach(s => {
    if (s.name || s.id) {
      data.selects[s.name || s.id] = s.value;
    }
  });

  // Save photo and signature
  const photoData = document.getElementById('input-applicant-photo-data');
  if (photoData && photoData.value) data.photo = photoData.value;

  const sigData = document.getElementById('input-applicant-signature-data');
  if (sigData && sigData.value) data.signature = sigData.value;

  const thumbData = document.getElementById('input-applicant-thumb-data');
  if (thumbData && thumbData.value) data.thumb = thumbData.value;

  // Save joint data
  const jointCountInp = document.getElementById('input-joint-members-count');
  if (jointCountInp) data.jointMembersCount = jointCountInp.value;

  // Save language and custom email domain
  data.language = (typeof window.getCurrentLanguage === 'function') ? window.getCurrentLanguage() : (localStorage.getItem('preferred_language') || 'en');
  data.middleNameOmitted = false;
  data.customEmailDomain = previousEmailDomain;

  return data;
}

async function saveCustomerFormDraft(notify = true) {
  if (isApplicationSubmitted) return;
  // Guard: Never attempt saving a backend draft before Step 1 is completed (branch selected & draft initiated)
  if (!currentApplicationNumber) return;

  try {
    const form = document.getElementById('form-customer-application');
    if (!form) return;

    const data = extractFullFormData(form);

    const secret = currentDraftSecret || window.currentDraftSecret || (function() {
      try { return sessionStorage.getItem('draft_secret_' + currentApplicationNumber); } catch (_) { return ''; }
    })() || '';

    // Persist draft to backend
    const branchSelect = document.getElementById('step2-branch-select') || document.getElementById('step1-branch-select');
    const branchName = branchSelect ? branchSelect.value : '';
    const branchCode = document.getElementById('step2-branch-code')?.value || document.getElementById('step1-branch-code')?.value || '';
    try {
      await api('/onboarding/save-draft', {
        method: 'POST',
        headers: secret ? { 'X-Draft-Secret': secret } : {},
        body: {
          applicationNumber: currentApplicationNumber,
          draftSecret: secret,
          accountType: selectedAccountType,
          branchName: branchName,
          branchCode: branchCode,
          formData: data
        }
      });
    } catch (backendErr) {
      console.warn('Backend draft sync note:', backendErr);
    }
    // Update draft timestamp indicator
    const ind = document.getElementById('draft-status-indicator');
    const tsEl = document.getElementById('draft-saved-timestamp');
    if (ind && tsEl) {
      tsEl.textContent = data.timestamp;
      ind.style.display = 'block';
    }

    if (notify) {
      showToast('Form draft saved! Application Number: ' + (currentApplicationNumber || 'Draft') + ' (Track & resume anytime)', 'success');
    }
  } catch (err) {
    console.warn('Draft auto-save exception:', err);
  }
}

async function loadCustomerFormDraft(targetAppNum) {
  try {
    const num = targetAppNum || currentApplicationNumber;
    if (num) {
      currentApplicationNumber = num;
      const toolbarApp = document.getElementById('toolbar-app-number');
      if (toolbarApp) toolbarApp.textContent = num;
      const headerApp = document.getElementById('header-app-number-display');
      if (headerApp) headerApp.textContent = num;
      const hiddenApp = document.getElementById('hidden-application-number');
      if (hiddenApp) hiddenApp.value = num;
    }

    const storageKey = getDraftStorageKey(num);
    let data = null;

    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { data = JSON.parse(raw); } catch (e) {}
    }

    // If no local draft or if fetching specific appNum, try backend
    if (!data && num) {
      try {
        const backendRes = await api(`/onboarding/draft/${num}`);
        if (backendRes) {
          data = backendRes.formData || {};
          if (backendRes.accountType) selectAccountType(backendRes.accountType);
          if (backendRes.branchName) syncBranchSelection(backendRes.branchName);
        }
      } catch (err) {
        console.warn('Could not load draft from backend:', err);
      }
    }

    if (!data) return false;

    const form = document.getElementById('form-customer-application');
    if (!form) return false;

    // Restore saved language across forms/refresh only if user hasn't actively selected one
    const activeUserLang = localStorage.getItem('neobank_lang');
    if (!activeUserLang && data.language && typeof window.handleLanguageChange === 'function') {
      window.handleLanguageChange(data.language, false);
    }

    if (data.accountType) {
      selectAccountType(data.accountType);
    }

    if (data.jointMembersCount) {
      const modeRadio = document.querySelector('input[name="modeOperationRadio"][value="JOINTLY"]');
      if (modeRadio) {
        modeRadio.checked = true;
        handleModeOperationChange('JOINTLY');
        setJointMembersCount(data.jointMembersCount);
      }
    }

    // Restore text inputs
    if (data.inputs) {
      Object.keys(data.inputs).forEach(key => {
        const inp = form.querySelector(`input[name="${key}"]`) || document.getElementById(key);
        if (inp && data.inputs[key] !== undefined) {
          inp.value = data.inputs[key];
          const wrap = inp.closest('.bank-box-wrap');
          if (wrap) updateBoxCells(wrap, inp.value);
        }
      });
    }

    // Ensure middle name input is visible
    const middleInputWrap = document.getElementById('middle-name-input-wrap');
    if (middleInputWrap) middleInputWrap.style.display = 'inline-flex';

    // Restore email username and domain (including custom domains)
    if (data.inputs && data.inputs['email']) {
      const emailFull = data.inputs['email'];
      if (emailFull.includes('@')) {
        const parts = emailFull.split('@');
        const username = parts[0];
        const domain = '@' + parts[1];
        const uInp = document.getElementById('email-username');
        const dSel = document.getElementById('email-domain-select');
        if (uInp) uInp.value = username;
        if (dSel) {
          let found = false;
          for (let opt of dSel.options) {
            if (opt.value === domain) {
              dSel.value = domain;
              previousEmailDomain = domain;
              found = true;
              break;
            }
          }
          if (!found) {
            const opt = document.createElement('option');
            opt.value = domain;
            opt.textContent = domain;
            const otherOpt = dSel.querySelector('option[value="OTHER"]');
            if (otherOpt) {
              dSel.insertBefore(opt, otherOpt);
            } else {
              dSel.appendChild(opt);
            }
            dSel.value = domain;
            previousEmailDomain = domain;
          }
        }
      }
    }

    // Restore radios
    if (data.radios) {
      Object.keys(data.radios).forEach(name => {
        const r = form.querySelector(`input[name="${name}"][value="${data.radios[name]}"]`);
        if (r) {
          r.checked = true;
          if (r.onchange) r.onchange();
        }
      });
    }

    // Restore checkboxes
    if (data.checkboxes) {
      Object.keys(data.checkboxes).forEach(id => {
        const c = form.querySelector(`input[name="${id}"]`) || document.getElementById(id);
        if (c) {
          c.checked = data.checkboxes[id];
          if (c.onchange) c.onchange();
        }
      });
    }

    // Restore selects
    if (data.selects) {
      Object.keys(data.selects).forEach(name => {
        const s = form.querySelector(`select[name="${name}"]`) || document.getElementById(name);
        if (s) {
          s.value = data.selects[name];
          if (s.onchange) s.onchange();
        }
      });
    }

    // Restore photo
    if (data.photo) {
      const previewImg = document.getElementById('passport-photo-img');
      const placeholder = document.getElementById('passport-photo-placeholder');
      const stampBadge = document.getElementById('passport-stamp-badge');
      const hiddenInput = document.getElementById('input-applicant-photo-data');
      if (previewImg) { previewImg.src = data.photo; previewImg.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
      if (stampBadge) stampBadge.style.display = 'block';
      if (hiddenInput) hiddenInput.value = data.photo;
    }

    // Restore signature
    if (data.signature) {
      const previewImg = document.getElementById('form-signature-preview');
      const placeholder = document.getElementById('form-signature-placeholder');
      const hiddenInput = document.getElementById('input-applicant-signature-data');
      if (previewImg) { previewImg.src = data.signature; previewImg.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
      if (hiddenInput) hiddenInput.value = data.signature;

      const part3Sig = document.getElementById('part3-sig1-preview');
      if (part3Sig) {
        part3Sig.innerHTML = `<img src="${data.signature}" style="max-height:46px;max-width:90%;object-fit:contain"><br><span style="font-size:0.68rem;color:var(--brand-500);font-weight:700">Primary Applicant ✓</span>`;
      }
      const jointSlot = document.getElementById('joint-primary-signature-slot');
      if (jointSlot) {
        jointSlot.innerHTML = `<img src="${data.signature}" style="max-height:36px;max-width:110px;object-fit:contain;background:rgba(255,255,255,0.9);padding:2px 4px;border-radius:4px;border:1px solid var(--border-subtle)" alt="Primary Sig"><br><span style="font-size:0.65rem;color:var(--brand-500);font-weight:700">✓ 1st Applicant</span>`;
      }
    } else if (data.thumb) {
      const previewImg = document.getElementById('form-signature-preview');
      const placeholder = document.getElementById('form-signature-placeholder');
      const hiddenInput = document.getElementById('input-applicant-thumb-data');
      if (previewImg) { previewImg.src = data.thumb; previewImg.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
      if (hiddenInput) hiddenInput.value = data.thumb;

      const part3Sig = document.getElementById('part3-sig1-preview');
      if (part3Sig) {
        part3Sig.innerHTML = `<img src="${data.thumb}" style="max-height:46px;max-width:90%;object-fit:contain"><br><span style="font-size:0.68rem;color:var(--emerald-400);font-weight:700">Thumb Verified ✓</span>`;
      }
    }

    if (data.timestamp) {
      const ind = document.getElementById('draft-status-indicator');
      const tsEl = document.getElementById('draft-saved-timestamp');
      if (ind && tsEl) {
        tsEl.textContent = data.timestamp;
        ind.style.display = 'block';
      }
    }

    syncApplicantFullName();
    return true;
  } catch (e) {
    console.warn('Failed to load draft:', e);
    return false;
  }
}

// ----------------------------------------------------------------- CLEAR ALL FORM (Isolated for this Application)
function confirmClearAllForm() {
  const confirmed = confirm('Are you sure you want to clear all entered data for this application? This will reset all fields and remove this application draft.');
  if (!confirmed) return;

  try {
    const key = getDraftStorageKey();
    localStorage.removeItem(key);
    const form = document.getElementById('form-customer-application');
    if (form) {
      form.reset();

      // Clear all box inputs explicitly
      form.querySelectorAll('.bank-box-wrap').forEach(wrap => {
        const input = wrap.querySelector('.bank-box-input');
        if (input) input.value = '';
        updateBoxCells(wrap, '');
      });

      // Clear photo
      const previewPhoto = document.getElementById('passport-photo-img');
      const placeholderPhoto = document.getElementById('passport-photo-placeholder');
      const stampBadge = document.getElementById('passport-stamp-badge');
      const hiddenPhoto = document.getElementById('input-applicant-photo-data');
      if (previewPhoto) { previewPhoto.src = ''; previewPhoto.style.display = 'none'; }
      if (placeholderPhoto) placeholderPhoto.style.display = 'flex';
      if (stampBadge) stampBadge.style.display = 'none';
      if (hiddenPhoto) hiddenPhoto.value = '';

      // Clear signature & thumb
      const previewSig = document.getElementById('form-signature-preview');
      const placeholderSig = document.getElementById('form-signature-placeholder');
      const metaContainer = document.getElementById('form-signature-meta');
      const hiddenSig = document.getElementById('input-applicant-signature-data');
      const hiddenThumb = document.getElementById('input-applicant-thumb-data');
      if (previewSig) { previewSig.src = ''; previewSig.style.display = 'none'; }
      if (placeholderSig) placeholderSig.style.display = 'block';
      if (metaContainer) metaContainer.style.display = 'none';
      if (hiddenSig) hiddenSig.value = '';
      if (hiddenThumb) hiddenThumb.value = '';

      // Reset today's date in header
      setTodayDateDefaults();

      // Reset indicators
      const ind = document.getElementById('draft-status-indicator');
      if (ind) ind.style.display = 'none';

      syncApplicantFullName();
      showToast('Form cleared. All fields reset.', 'info');
    }
  } catch (e) {
    console.error('Error clearing form:', e);
  }
}

// ----------------------------------------------------------------- CUSTOM PHONE COUNTRY DROPDOWN (Delegated to dropdown.js)
function initCustomPhoneDropdowns() {
  if (typeof window.initCustomFlagDropdowns === 'function') {
    window.initCustomFlagDropdowns();
  }
}
window.initCustomPhoneDropdowns = initCustomPhoneDropdowns;

function handleCountryCodeChange(type, code) {
  if (typeof window.handleCountryCodeChange === 'function' && window.handleCountryCodeChange !== handleCountryCodeChange) {
    window.handleCountryCodeChange(type, code);
    return;
  }
  const isAlt = type === 'altMobile';
  const sel = document.getElementById(isAlt ? 'alt-mobile-country-code' : 'mobile-country-code');
  if (sel && sel.value !== code) {
    sel.value = code;
  }
  const rawInput = document.getElementById(isAlt ? 'raw-alt-mobile' : 'raw-mobile-number');
  if (!isAlt) {
    const hPhone = document.getElementById('hidden-phone');
    if (hPhone && rawInput) {
      hPhone.value = rawInput.value ? code + rawInput.value : '';
    }
  }
  debounceSaveDraft();
}
if (!window.handleCountryCodeChange) {
  window.handleCountryCodeChange = handleCountryCodeChange;
}

// ----------------------------------------------------------------- SET DEFAULT TODAY DATE (Fix 9)
function setTodayDateDefaults() {
  const headerDateInput = document.getElementById('raw-header-date');
  const headerDateWrap = document.getElementById('wrap-header-date');
  if (headerDateInput && (!headerDateInput.value || !headerDateInput.value.trim())) {
    const today = new Date(); // Local system date (not UTC)
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = String(today.getFullYear());
    const dateFormatted = `${dd}${mm}${yyyy}`;

    headerDateInput.value = dateFormatted;
    if (headerDateWrap) updateBoxCells(headerDateWrap, dateFormatted);

    const declDateEl = document.getElementById('paper-declaration-date');
    if (declDateEl) {
      declDateEl.textContent = `${dd} / ${mm} / ${yyyy}`;
    }
  }
}

// ----------------------------------------------------------------- PREPARE & PRINT BANK FORM (Item 1 & 15)
function prepareAndPrintBankForm() {
  // Sync address fields into hidden addressLine for backend and print
  const hHouse = document.getElementById('input-addr-house');
  const hStreet = document.getElementById('input-addr-street');
  const hLandmark = document.getElementById('input-addr-landmark');
  const hLine = document.getElementById('hidden-address-line');
  if (hLine) {
    const full = [
      hHouse ? hHouse.value.trim() : '',
      hStreet ? hStreet.value.trim() : '',
      hLandmark ? hLandmark.value.trim() : ''
    ].filter(Boolean).join(', ');
    hLine.value = full;
  }

  // Update declaration place from city
  const cityInput = document.getElementById('input-city');
  const placeEl = document.getElementById('paper-declaration-place');
  if (cityInput && placeEl) {
    placeEl.textContent = cityInput.value.toUpperCase() || 'MUMBAI';
  }

  // Temporarily ensure all parts are visible for multi-page print
  const previousPart = currentActiveFormPart;
  switchFormPart('all');

  setTimeout(() => {
    window.print();
    // Restore user's previous single-part view after printing dialog closes
    setTimeout(() => {
      switchFormPart(previousPart);
    }, 500);
  }, 100);
}

// ----------------------------------------------------------------- INITIALIZE BANK PAPER FORM
function initPaperForm() {
  // 1. Initialize segmented box inputs
  initBankBoxInputs();

  // 1b. Initialize custom phone country code dropdowns with SVG flags (Fix 7 & Fix 8)
  initCustomPhoneDropdowns();

  // 2. City change listener to update declaration place
  const cityInput = document.getElementById('input-city');
  if (cityInput) {
    const updatePlace = () => {
      const placeEl = document.getElementById('paper-declaration-place');
      if (placeEl) placeEl.textContent = cityInput.value.toUpperCase() || 'MUMBAI';
    };
    cityInput.addEventListener('input', updatePlace);
  }

  // 3. Address components sync
  ['input-addr-house', 'input-addr-street', 'input-addr-landmark'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        const hHouse = document.getElementById('input-addr-house');
        const hStreet = document.getElementById('input-addr-street');
        const hLandmark = document.getElementById('input-addr-landmark');
        const hLine = document.getElementById('hidden-address-line');
        if (hLine) {
          hLine.value = [
            hHouse ? hHouse.value.trim() : '',
            hStreet ? hStreet.value.trim() : '',
            hLandmark ? hLandmark.value.trim() : ''
          ].filter(Boolean).join(', ');
        }
      });
    }
  });

  // 4. Try restoring saved draft from localStorage
  const hasDraft = loadCustomerFormDraft();

  // 5. If no saved draft or header date is empty, set default today's date in local time (Fix 9)
  setTodayDateDefaults();

  // 6. Sync joint applicant section
  updateJointApplicantVisibility();
  syncApplicantFullName();

  // 7. Dynamic Form Error Clearing listeners (Requirement 3)
  const formApp = document.getElementById('form-customer-application');
  if (formApp) {
    formApp.addEventListener('input', (e) => clearErrorOnValidInput(e.target));
    formApp.addEventListener('change', (e) => clearErrorOnValidInput(e.target));
  }

  // 8. Initialize conditional debit card dependent fields (Requirement 11)
  const debitRadioVal = document.querySelector('input[name="svcDebitRadio"]:checked')?.value || 'YES';
  handleDebitCardRequiredToggle(debitRadioVal);

  // 9. Standard Date input validation constraints (1900 to today - Requirements 3 & 4)
  const todayIso = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(inp => {
    if (!inp.name?.toLowerCase().includes('expiry') && inp.id !== 'emp-apps-end-date') {
      inp.max = todayIso;
    }
    inp.min = '1900-01-01';
  });
}

// ----------------------------------------------------------------- DYNAMIC VALIDATION & DATE HANDLING (Requirements 3 & 4)
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
    } else if (targetName === 'panNumber' || target.id === 'raw-pan-number') {
      isValid = val.length >= 10;
    } else if (targetName === 'aadhaarNumber' || target.id === 'raw-aadhaar-number') {
      isValid = val.length >= 12;
    } else if (targetName === 'mobileNumber' || target.id === 'raw-mobile-number') {
      isValid = val.length >= 8;
    } else if (targetName === 'postalCode' || targetName === 'corrPostalCode' || target.id === 'raw-pincode') {
      isValid = val.length >= 6;
    } else if (['firstName', 'fatherName', 'motherName', 'lastName'].includes(targetName) || target.id?.startsWith('raw-')) {
      isValid = val.length > 0;
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
        if (strong) strong.classList.remove('label-invalid-mandatory');
      }
      if (target.name === 'namePrefix') document.getElementById('label-name-prefix')?.classList.remove('label-invalid-mandatory');
      if (target.name === 'genderRadio') target.closest('div')?.parentElement?.querySelector('label')?.classList.remove('label-invalid-mandatory');
      if (target.name === 'maritalRadio') document.getElementById('label-marital')?.classList.remove('label-invalid-mandatory');
      if (target.name === 'nationalityRadio') document.getElementById('label-nationality')?.classList.remove('label-invalid-mandatory');
      if (target.name === 'empStatusRadio') document.getElementById('label-emp-status')?.classList.remove('label-invalid-mandatory');
    } else if (target.type === 'checkbox') {
      const checked = document.querySelectorAll('input[name="ovdSelectChk"]:checked');
      if (checked.length > 0) {
        document.querySelector('.bank-table-grid')?.classList.remove('field-invalid-mandatory');
        document.querySelector('.bank-table-grid')?.previousElementSibling?.classList.remove('label-invalid-mandatory');
      }
    } else if (target.id === 'step2-branch-select') {
      isValid = Boolean(target.value);
      if (isValid) {
        target.classList.remove('field-invalid-mandatory');
        target.closest('td')?.querySelector('strong')?.classList.remove('label-invalid-mandatory');
      }
    } else if (target.id === 'input-annual-income') {
      isValid = parseFloat(target.value) > 0;
      if (isValid) {
        target.classList.remove('field-invalid-mandatory');
        document.getElementById('label-annual-income')?.classList.remove('label-invalid-mandatory');
      }
    } else if (target.id === 'email-username' || target.id === 'hidden-combined-email') {
      const emailVal = document.getElementById('hidden-combined-email')?.value || '';
      const usernameVal = document.getElementById('email-username')?.value || '';
      isValid = (emailVal.includes('@') && emailVal.length > 3) || usernameVal.trim().length > 0;
      if (isValid) {
        document.getElementById('email-username')?.classList.remove('field-invalid-mandatory');
        document.getElementById('email-username')?.parentElement?.previousElementSibling?.classList.remove('label-invalid-mandatory');
      }
    } else if (target.id === 'input-password' || target.id === 'input-onboarding-password') {
      isValid = target.value && target.value.trim().length >= 8;
      if (isValid) {
        target.classList.remove('field-invalid-mandatory');
        document.getElementById('label-onboarding-password')?.classList.remove('label-invalid-mandatory');
      }
    } else if (target.id === 'input-addr-house' || target.id === 'input-city') {
      isValid = target.value && target.value.trim().length > 0;
      if (isValid) {
        target.classList.remove('field-invalid-mandatory');
        target.parentElement?.querySelector('label')?.classList.remove('label-invalid-mandatory');
      }
    } else if (target.id === 'input-initial-deposit') {
      isValid = target.value !== '' && parseFloat(target.value) >= 0;
      if (isValid) {
        target.classList.remove('field-invalid-mandatory');
        target.parentElement?.querySelector('label')?.classList.remove('label-invalid-mandatory');
      }
    }

    if (isValid && target.classList) {
      target.classList.remove('field-invalid-mandatory');
    }
  }

  refreshMissingBadges();
}

function refreshMissingBadges() {
  document.querySelectorAll('.section-pending-badge').forEach(el => el.remove());
  if (typeof window.updateLiveMissingCounters === 'function') {
    window.updateLiveMissingCounters();
  }
}

// ----------------------------------------------------------------- COMPREHENSIVE FORM VALIDATION (Item 14)
function validateCustomerFormFields(shouldScroll = true) {
  if (typeof window.getDetailedValidationReport === 'function') {
    document.querySelectorAll('.field-invalid-mandatory').forEach(el => el.classList.remove('field-invalid-mandatory'));
    document.querySelectorAll('.cell-invalid').forEach(el => el.classList.remove('cell-invalid'));
    document.querySelectorAll('.label-invalid-mandatory').forEach(el => el.classList.remove('label-invalid-mandatory'));
    document.querySelectorAll('.section-pending-badge').forEach(el => el.remove());

    const report = window.getDetailedValidationReport();

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

    if (typeof window.updateGlassmorphicValidationIndicator === 'function') {
      window.updateGlassmorphicValidationIndicator(report);
    }
    if (typeof window.updateLiveMissingCounters === 'function') {
      window.updateLiveMissingCounters();
    }

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
          } else {
            const inner = report.firstInvalidEl.querySelector('input, select');
            if (inner) inner.focus();
          }
        }, 150);
      }
      showToast(`Please complete ${report.totalMissing} required field(s) marked in red. Hover over the indicator to view details.`, 'error');
      return false;
    }
    return true;
  }

  // Clear all previous validation states
  document.querySelectorAll('.field-invalid-mandatory').forEach(el => el.classList.remove('field-invalid-mandatory'));
  document.querySelectorAll('.cell-invalid').forEach(el => el.classList.remove('cell-invalid'));
  document.querySelectorAll('.label-invalid-mandatory').forEach(el => el.classList.remove('label-invalid-mandatory'));
  document.querySelectorAll('.section-pending-badge').forEach(el => el.remove());

  let firstInvalidEl = null;
  let totalMissing = 0;

  function markInvalid(el, labelEl, sectionObj, fieldName) {
    totalMissing++;
    if (el) {
      el.classList.add('field-invalid-mandatory');
      if (el.classList.contains('bank-box-wrap')) {
        el.querySelectorAll('.char-cell').forEach(c => c.classList.add('cell-invalid'));
      }
      if (!firstInvalidEl) firstInvalidEl = el;
    }
    if (labelEl) {
      labelEl.classList.add('label-invalid-mandatory');
      if (!firstInvalidEl) firstInvalidEl = labelEl;
    }
    if (sectionObj && fieldName) {
      sectionObj.missing.push(fieldName);
    }
  }

  // Section 0: Top Header Table
  const secHeader = { el: document.getElementById('header-sec-0'), missing: [] };
  const appType = document.querySelector('input[name="appTypeRadio"]:checked');
  if (!appType) {
    const parent = document.querySelector('input[name="appTypeRadio"]')?.closest('td');
    markInvalid(parent, parent?.querySelector('strong'), secHeader, 'Application Type');
  }
  const accCat = document.querySelector('input[name="accCategoryRadio"]:checked');
  if (!accCat) {
    const parent = document.querySelector('input[name="accCategoryRadio"]')?.closest('td');
    markInvalid(parent, parent?.querySelector('strong'), secHeader, 'Account Category');
  }
  const appDateInp = document.getElementById('raw-header-date');
  const appDateVal = appDateInp ? appDateInp.value.trim() : '';
  const appDateRes = validateDateString(appDateVal, false);
  if (!appDateRes.valid) {
    const wrap = document.getElementById('wrap-header-date');
    markInvalid(wrap, wrap?.closest('td')?.querySelector('strong'), secHeader, 'Application Date: ' + appDateRes.error);
  }
  const branchSelect = document.getElementById('step2-branch-select');
  if (!branchSelect || !branchSelect.value) {
    markInvalid(branchSelect, branchSelect?.closest('td')?.querySelector('strong'), secHeader, 'Branch Name & Code');
  }

  // Section 1: Personal Details
  const sec1 = { el: document.getElementById('header-sec-1'), missing: [] };
  const prefix = document.querySelector('input[name="namePrefix"]:checked');
  if (!prefix) {
    markInvalid(null, document.getElementById('label-name-prefix'), sec1, 'Prefix');
  }
  const firstName = document.getElementById('raw-first-name');
  if (!firstName || !firstName.value.trim()) {
    markInvalid(firstName?.closest('.bank-box-wrap'), firstName?.closest('.char-input-group')?.querySelector('.char-input-label-row span'), sec1, 'First Name');
  }
  const fatherName = document.getElementById('raw-father-name');
  if (!fatherName || !fatherName.value.trim()) {
    markInvalid(fatherName?.closest('.bank-box-wrap'), fatherName?.closest('.char-input-group')?.querySelector('.char-input-label-row span'), sec1, "Father's Name");
  }
  const motherName = document.getElementById('raw-mother-name');
  if (!motherName || !motherName.value.trim()) {
    markInvalid(motherName?.closest('.bank-box-wrap'), motherName?.closest('.char-input-group')?.querySelector('.char-input-label-row span'), sec1, "Mother's Name");
  }
  const dob = document.getElementById('raw-dob-date') || document.getElementById('raw-dob') || document.querySelector('input[name="dob"]');
  const dobVal = dob ? dob.value.trim() : '';
  const dobRes = validateDateString(dobVal, true);
  if (!dobRes.valid) {
    const labelEl = document.getElementById('label-dob') || dob?.closest('.bank-box-wrap')?.parentElement?.querySelector('label');
    markInvalid(dob?.closest('.bank-box-wrap'), labelEl, sec1, 'Date of Birth: ' + dobRes.error);
  }
  const gender = document.querySelector('input[name="genderRadio"]:checked');
  if (!gender) {
    const label = document.querySelector('input[name="genderRadio"]')?.closest('div')?.parentElement?.querySelector('label');
    markInvalid(null, label, sec1, 'Gender');
  }
  const marital = document.querySelector('input[name="maritalRadio"]:checked');
  if (!marital) {
    markInvalid(null, document.getElementById('label-marital'), sec1, 'Marital Status');
  }
  const nationality = document.querySelector('input[name="nationalityRadio"]:checked');
  if (!nationality) {
    markInvalid(null, document.getElementById('label-nationality'), sec1, 'Nationality');
  }

  // Section 2: Occupation & Financial Profile
  const sec2 = { el: document.getElementById('header-sec-2'), missing: [] };
  const empStatus = document.querySelector('input[name="empStatusRadio"]:checked');
  if (!empStatus) {
    markInvalid(null, document.getElementById('label-emp-status'), sec2, 'Occupation Type');
  }
  const annualIncome = document.getElementById('input-annual-income');
  if (!annualIncome || !annualIncome.value || parseFloat(annualIncome.value) <= 0) {
    markInvalid(annualIncome, document.getElementById('label-annual-income'), sec2, 'Gross Annual Income');
  }
  const incomeBracket = document.querySelector('input[name="incomeBracketRadio"]:checked');
  if (!incomeBracket) {
    const label = document.querySelector('input[name="incomeBracketRadio"]')?.closest('div')?.parentElement?.querySelector('span');
    markInvalid(null, label, sec2, 'Income Bracket');
  }
  const sourceFunds = document.querySelector('input[name="sourceFundsRadio"]:checked');
  if (!sourceFunds) {
    const label = document.querySelector('input[name="sourceFundsRadio"]')?.closest('div')?.parentElement?.querySelector('span');
    markInvalid(null, label, sec2, 'Source of Funds');
  }

  // Section 3: Identification & Tax Information
  const sec3 = { el: document.getElementById('header-sec-3'), missing: [] };
  const pan = document.getElementById('raw-pan-number');
  if (!pan || pan.value.trim().length < 10) {
    markInvalid(pan?.closest('.bank-box-wrap'), pan?.closest('div')?.querySelector('.char-input-label-row span'), sec3, 'PAN Number');
  }
  const aadhaar = document.getElementById('raw-aadhaar-number');
  if (!aadhaar || aadhaar.value.trim().length < 12) {
    markInvalid(aadhaar?.closest('.bank-box-wrap'), aadhaar?.closest('div')?.querySelector('.char-input-label-row span'), sec3, 'Aadhaar Number');
  }

  // Section 4: Contact Details (Page 1 Continued / CIF)
  const sec4 = { el: document.getElementById('header-sec-4'), missing: [] };
  const mobile = document.getElementById('raw-mobile-number');
  if (!mobile || mobile.value.trim().length < 8) {
    markInvalid(mobile?.closest('.bank-box-wrap'), document.getElementById('label-mobile'), sec4, 'Mobile Number');
  }
  const emailInp = document.getElementById('hidden-combined-email') || document.querySelector('input[name="email"]');
  const emailUsernameInp = document.getElementById('email-username');
  const emailVal = emailInp?.value || '';
  const usernameVal = emailUsernameInp?.value || '';
  if ((!emailVal.trim() || !emailVal.includes('@')) && !usernameVal.trim()) {
    markInvalid(emailUsernameInp || emailInp, document.getElementById('email-username')?.parentElement?.previousElementSibling, sec4, 'Email ID');
  }

  // Section 5 (Page 2): Proof of Identity / Address (OVD)
  const secOvd = { el: document.getElementById('header-sec-ovd'), missing: [] };
  const checkedOvds = document.querySelectorAll('input[name="ovdSelectChk"]:checked');
  if (!checkedOvds || checkedOvds.length === 0) {
    const ovdTable = document.querySelector('.bank-table-grid');
    markInvalid(ovdTable, ovdTable?.previousElementSibling, secOvd, 'OVD (Select at least one document)');
  }

  // Section 6 (Address Details):
  const secAddr = { el: document.getElementById('header-sec-addr'), missing: [] };
  const house = document.getElementById('input-addr-house');
  if (!house || !house.value.trim()) {
    markInvalid(house, house?.parentElement?.querySelector('label'), secAddr, 'Flat / House No.');
  }
  const city = document.getElementById('input-city');
  if (!city || !city.value.trim()) {
    markInvalid(city, city?.parentElement?.querySelector('label'), secAddr, 'City / Town');
  }
  const pincode = document.getElementById('raw-pincode');
  if (!pincode || pincode.value.trim().length < 6) {
    markInvalid(pincode?.closest('.bank-box-wrap'), pincode?.closest('div')?.querySelector('.char-input-label-row span'), secAddr, 'PIN Code');
  }

  // Section 7: Photograph & Verification Signature
  const sec7 = { el: document.getElementById('header-sec-photo-sig'), missing: [] };
  const photo = document.getElementById('input-applicant-photo-data');
  if (!photo || !photo.value) {
    const box = document.querySelector('.passport-photo-box');
    markInvalid(box, box?.previousElementSibling, sec7, 'Passport Photograph');
  }
  const sig = document.getElementById('input-applicant-signature-data');
  const thumb = document.getElementById('input-applicant-thumb-data');
  if ((!sig || !sig.value) && (!thumb || !thumb.value)) {
    const slot = document.getElementById('slot-applicant-signature');
    markInvalid(slot, slot?.previousElementSibling, sec7, 'Specimen Signature / Thumb');
  }

  // Part II: Initial Deposit & Online Banking Password (Page 3: Account Form - Requirement 7)
  const secPart2 = { el: document.getElementById('header-sec-part2-acc'), missing: [] };
  const initialDep = document.getElementById('input-initial-deposit');
  if (!initialDep || !initialDep.value || parseFloat(initialDep.value) < 0) {
    markInvalid(initialDep, initialDep?.parentElement?.querySelector('label'), secPart2, 'Initial Deposit');
  }
  const onboardingPwd = document.getElementById('input-password') || document.getElementById('input-onboarding-password');
  if (!onboardingPwd || !onboardingPwd.value || onboardingPwd.value.trim().length < 8) {
    markInvalid(onboardingPwd, document.getElementById('label-onboarding-password') || onboardingPwd?.parentElement?.previousElementSibling, secPart2, 'Online Banking Password (min 8 chars)');
  }

  // Joint Applicants (if Jointly Operated)
  const modeVal = document.querySelector('input[name="modeOperationRadio"]:checked')?.value;
  if (modeVal === 'JOINTLY') {
    const secJoint = { el: document.getElementById('header-sec-joint'), missing: [] };
    const n = Math.max(2, Math.min(10, parseInt(document.getElementById('input-joint-members-count')?.value || 2, 10)));
    for (let i = 2; i <= n; i++) {
      const jFirstName = document.getElementById(`raw-joint${i}-first-name`);
      if (!jFirstName || !jFirstName.value.trim()) {
        markInvalid(jFirstName, null, secJoint, `Applicant #${i} First Name`);
      }
      const jLastName = document.getElementById(`raw-joint${i}-last-name`);
      if (!jLastName || !jLastName.value.trim()) {
        markInvalid(jLastName, null, secJoint, `Applicant #${i} Last Name`);
      }
      const jSig = document.getElementById(`input-joint${i}-signature-data`);
      if (!jSig || !jSig.value) {
        markInvalid(document.getElementById(`joint${i}-signature-slot`), null, secJoint, `Applicant #${i} Specimen Signature`);
      }
    }
  }

  // Ensure all badges and tab counters are removed (Fix 2)
  refreshMissingBadges();

  if (totalMissing > 0) {
    if (shouldScroll && firstInvalidEl) {
      // Ensure element's container part is visible
      const parentPart = firstInvalidEl.closest('.form-part-section');
      if (parentPart && parentPart.id && currentActiveFormPart !== 'all') {
        const partKey = parentPart.id.replace('form-container-', '');
        switchFormPart(partKey);
      }
      setTimeout(() => {
        firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (firstInvalidEl.tagName === 'INPUT' || firstInvalidEl.tagName === 'SELECT') {
          firstInvalidEl.focus();
        } else {
          const innerInp = firstInvalidEl.querySelector('input, select');
          if (innerInp) innerInp.focus();
        }
      }, 100);
    }
    showToast(`Please complete ${totalMissing} required field(s) marked in red.`, 'error');
    return false;
  }

  return true;
}

// ----------------------------------------------------------------- WIZARD NAVIGATION (Step 1 -> 2 -> 3 -> 4)
function goToOnboardingStep(stepNumber) {
  // Step validation
  if (stepNumber === 2) {
    const agreed = document.getElementById('chk-eligibility-agreed');
    if (agreed && !agreed.checked) {
      if (currentApplicationNumber) {
        agreed.checked = true;
      } else {
        showToast('Please confirm that you meet the bank eligibility requirements.', 'error');
        return;
      }
    }
    adaptFieldsForAccountType(selectedAccountType);
    if (!currentApplicationNumber) {
      setTimeout(initPaperForm, 50);
    }
  } else if (stepNumber === 3) {
    const isValid = validateCustomerFormFields(true);
    if (!isValid) {
      return;
    }
  }

  // Manage Hero, Benefits, and Journey visibility:
  // When on Step 2, 3, or 4, hide top hero sections so the user directly sees the wizard steps!
  const heroEl = document.getElementById('onboarding-hero-section');
  const benefitsEl = document.getElementById('onboarding-benefits-section');
  const journeyEl = document.getElementById('onboarding-journey-section');

  if (stepNumber > 1) {
    if (heroEl) heroEl.style.display = 'none';
    if (benefitsEl) benefitsEl.style.display = 'none';
    if (journeyEl) journeyEl.style.display = 'none';
  } else {
    if (heroEl) heroEl.style.display = 'block';
    if (benefitsEl) benefitsEl.style.display = 'block';
    if (journeyEl) journeyEl.style.display = 'block';
  }

  // Hide all step panels
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`onboarding-step-${i}`);
    if (el) el.style.display = 'none';

    const indicator = document.getElementById(`step-indicator-${i}`);
    if (indicator) {
      indicator.classList.remove('active', 'completed');
      if (i < stepNumber) indicator.classList.add('completed');
      if (i === stepNumber) indicator.classList.add('active');
    }
  }

  // Show target step
  const targetStep = document.getElementById(`onboarding-step-${stepNumber}`);
  if (targetStep) targetStep.style.display = 'block';

  // Toggle Floating Action Bar visibility (Requirement 8)
  const floatingBar = document.getElementById('floating-form-action-bar');
  if (floatingBar) {
    floatingBar.style.display = (stepNumber === 2) ? 'flex' : 'none';
  }
  if (stepNumber === 2) {
    updateFlowActionButtons(currentActiveFormPart || 'part1');
  }

  // Smoothly scroll directly to the wizard steps right under the header
  const wizardSection = document.getElementById('wizard-section');
  if (wizardSection) {
    const headerOffset = 80;
    const y = wizardSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }
}

// ----------------------------------------------------------------- SUBMIT APPLICATION (Step 3 -> Step 4)
async function submitCustomerApplication(form) {
  try {
    if (!form || !form.elements) {
      form = document.getElementById('form-customer-application');
    }

    // Intercept "Submit Application" action on the final step before generating the application number or initiating backend submission
    window.hasAttemptedSubmit = true;
    const validationReport = typeof window.getDetailedValidationReport === 'function' ? window.getDetailedValidationReport() : null;
    if (validationReport && !validationReport.isValid) {
      if (typeof window.updateLiveMissingCounters === 'function') {
        window.updateLiveMissingCounters();
      }
      validateCustomerFormFields(false);
      const toolbar = document.querySelector('.form-editor-toolbar') || document.getElementById('btn-tab-part1');
      if (toolbar) {
        toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      showToast(`Cannot Submit Application: ${validationReport.totalMissing} mandatory field(s) missing. Hover over the red badges on the page tabs above to see details.`, 'error');
      return;
    }

    const isValid = validateCustomerFormFields(true);
    if (!isValid) return;

    const empStatusVal = (form.empStatus && form.empStatus.value) ? form.empStatus.value : 
                         (document.querySelector('input[name="empStatusRadio"]:checked')?.value || 'EMPLOYED');
    let employerNameVal = 'Not Specified';

    if (empStatusVal === 'EMPLOYED') {
      employerNameVal = (form.employer && form.employer.value.trim()) ? form.employer.value.trim() : 'FinTech Ltd';
    } else if (empStatusVal === 'SELF_EMPLOYED') {
      employerNameVal = (form.employer && form.employer.value.trim()) ? form.employer.value.trim() : 'Self-Employed / Business Owner';
    } else if (empStatusVal === 'STUDENT') {
      employerNameVal = (form.universityName && form.universityName.value.trim()) ? form.universityName.value.trim() : 'Student';
    } else if (empStatusVal === 'RETIRED') {
      employerNameVal = 'Retired';
    } else {
      employerNameVal = 'Unemployed / Not Applicable';
    }

    const initialDep = parseFloat(form.initialDeposit ? form.initialDeposit.value : (document.getElementById('input-initial-deposit')?.value || 0));
    const panVal = (form.taxId && form.taxId.value) ? form.taxId.value.trim() : (document.getElementById('raw-pan-number')?.value.trim() || 'ABCDE1234F');
    
    // Sync combined email domain selector (Item 11)
    if (typeof syncCombinedEmail === 'function') {
      syncCombinedEmail();
    }
    const combinedEmailEl = document.getElementById('hidden-combined-email');
    const emailVal = (combinedEmailEl && combinedEmailEl.value) ? combinedEmailEl.value.trim() : 
                     ((form.email && form.email.value) ? form.email.value.trim() : (document.querySelector('input[name="email"]')?.value.trim() || ''));
    
    // Clean user password with no default fallback (Requirement 7)
    const pwdVal = document.getElementById('input-password')?.value || document.getElementById('input-onboarding-password')?.value || (form.password && form.password.value) || '';
    const cardSchemeVal = document.querySelector('input[name="cardSchemeRadio"]:checked')?.value || 'RUPAY';
    const cardFormatVal = document.querySelector('input[name="cardFormatRadio"]:checked')?.value || 'BOTH';
    const fNameVal = (form.firstName && form.firstName.value) ? form.firstName.value.trim() : (document.getElementById('raw-first-name')?.value.trim() || 'Applicant');
    const lNameVal = (form.lastName && form.lastName.value) ? form.lastName.value.trim() : (document.getElementById('raw-last-name')?.value.trim() || 'Customer');
    let dobVal = (form.dob && form.dob.value) ? form.dob.value.trim() : (document.getElementById('raw-dob-date')?.value.trim() || '1990-01-01');
    if (/^\d{8}$/.test(dobVal)) {
      const d = dobVal.substring(0, 2);
      const m = dobVal.substring(2, 4);
      const y = dobVal.substring(4, 8);
      dobVal = `${y}-${m}-${d}`;
    } else if (/^\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}$/.test(dobVal)) {
      const parts = dobVal.split(/[\/\-\.]/);
      dobVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const rawPhone = (form.phone && form.phone.value) ? form.phone.value : (document.getElementById('hidden-phone')?.value || document.getElementById('raw-mobile-number')?.value || '9876543210');
    let phoneVal = rawPhone.replace(/[^\d+]/g, '');
    if (!phoneVal.startsWith('+')) {
      const code = (document.getElementById('select-phone-country-code')?.value || '+91').replace(/[^\d+]/g, '');
      phoneVal = `${code}${phoneVal}`;
    }
    const addrVal = (form.addressLine && form.addressLine.value) ? form.addressLine.value.trim() : (document.getElementById('input-addr-house')?.value.trim() || 'Main Street');
    const cityVal = (form.city && form.city.value) ? form.city.value.trim() : (document.getElementById('input-city')?.value.trim() || 'Downtown');
    const pinVal = (form.postalCode && form.postalCode.value) ? form.postalCode.value.trim() : (document.getElementById('raw-pincode')?.value.trim() || '400001');
    const countryVal = 'IN';
    const annIncome = parseFloat(form.annualIncome ? form.annualIncome.value : (document.getElementById('input-annual-income')?.value || 0));

    const idTypeVal = (form.idDocType && form.idDocType.value) ? form.idDocType.value : 'NATIONAL_ID';
    const idNumVal = (form.idDocNumber && form.idDocNumber.value.trim()) ? form.idDocNumber.value.trim() : (document.getElementById('raw-aadhaar-number')?.value.trim() || panVal);
    const addrDocTypeVal = (form.addrDocType && form.addrDocType.value) ? form.addrDocType.value : 'UTILITY_BILL';
    const addrDocNumVal = (form.addrDocNumber && form.addrDocNumber.value.trim()) ? form.addrDocNumber.value.trim() : 'OVD-AUTO-VERIFIED';

    const branchNameVal = document.getElementById('step2-branch-select')?.value || document.getElementById('step1-branch-select')?.value || 'Downtown Main Branch';
    const branchCodeVal = document.getElementById('step2-branch-code')?.value || document.getElementById('step1-branch-code')?.value || 'BR001';

    const payload = {
      accountType: selectedAccountType,
      currency: 'INR',
      initialDeposit: isNaN(initialDep) ? 0 : initialDep,
      taxId: panVal,
      email: emailVal,
      password: pwdVal,
      cardScheme: cardSchemeVal,
      cardFormat: cardFormatVal,
      applicationType: 'NEW',
      applicationNumber: currentApplicationNumber || undefined,
      branchName: branchNameVal,
      branchCode: branchCodeVal,
      applicant: {
        firstName: fNameVal,
        lastName: lNameVal,
        dob: dobVal,
        phone: phoneVal,
        address: {
          line1: addrVal,
          city: cityVal,
          postalCode: pinVal,
          country: countryVal
        }
      },
      employment: {
        status: empStatusVal,
        employer: employerNameVal,
        annualIncome: isNaN(annIncome) ? 0 : annIncome
      },
      identityDocument: {
        type: idTypeVal,
        number: idNumVal,
        issuingCountry: countryVal,
        expiryDate: (form.idExpiryDate && form.idExpiryDate.value) ? form.idExpiryDate.value : undefined
      },
      addressProof: {
        type: addrDocTypeVal,
        number: addrDocNumVal,
        issuingCountry: countryVal
      },
      formData: extractFullFormData(form),
      agreedToTerms: true
    };

    // Cancel any pending draft timer immediately
    if (draftSaveTimeout) {
      clearTimeout(draftSaveTimeout);
      draftSaveTimeout = null;
    }

    const res = await api('/onboarding/apply', {
      method: 'POST',
      body: payload
    });

    if (!res || !res.applicationNumber) {
      throw new Error('Failed to obtain application confirmation reference');
    }

    // Mark as submitted to disable any auto-save draft calls
    isApplicationSubmitted = true;
    if (draftSaveTimeout) {
      clearTimeout(draftSaveTimeout);
      draftSaveTimeout = null;
    }

    // Clear local storage draft now that application is successfully registered
    if (res.applicationNumber) {
      try {
        localStorage.removeItem(getDraftStorageKey(res.applicationNumber));
        localStorage.removeItem('neobank_form_draft_default');
      } catch (e) {}
    }

    // Auto upload mock scanned docs with AES-256 encryption in background
    uploadMockDocuments(res.applicationNumber, form);

    // Render Confirmation Step 4
    document.getElementById('confirmation-app-number').textContent = res.applicationNumber;
    document.getElementById('confirmation-applicant-name').textContent = `${payload.applicant.firstName} ${payload.applicant.lastName}`;
    document.getElementById('confirmation-account-type').textContent = formatHumanText(res.accountType);
    document.getElementById('confirmation-deposit').textContent = `₹ ${payload.initialDeposit.toFixed(2)}`;

    // Wire track application button with direct reference number
    const trackBtns = document.querySelectorAll('a[href^="/existing_application"]');
    trackBtns.forEach(btn => {
      btn.href = `/existing_application?app=${encodeURIComponent(res.applicationNumber)}`;
    });

    // Render official application summary dossier into Step 4
    renderApplicationSummaryDossier(payload);

    // Transition to Step 4
    goToOnboardingStep(4);
    showToast(`Application ${res.applicationNumber} registered successfully!`, 'success');

    // Item 6: Open Submission Guidance & Login Credentials Modal
    openSubmissionGuidanceModal(res.applicationNumber, emailVal, phoneVal);

  } catch (err) {
    showToast(err.message || 'Error submitting application', 'error');
  }
}

// ----------------------------------------------------------------- OFFICIAL APPLICATION SUMMARY & REVIEW DOSSIER
function renderApplicationSummaryDossier(payload) {
  const container = document.getElementById('confirmation-summary-sections-container');
  if (!container) return;

  const applicant = (payload && payload.applicant) || {};
  const emp = (payload && payload.employment) || {};
  const addr = (applicant && applicant.address) || {};
  const idDoc = (payload && payload.identityDocument) || {};
  const addrDoc = (payload && payload.addressProof) || {};
  const formData = (payload && payload.formData) || {};
  const inputs = formData.inputs || {};
  const radios = formData.radios || {};
  const selects = formData.selects || {};

  const formatVal = (v) => {
    if (v === undefined || v === null || String(v).trim() === '' || String(v).trim().toUpperCase() === 'N/A' || String(v).trim().toLowerCase() === 'undefined') {
      return '<span class="not-provided">Not Provided</span>';
    }
    return String(v).trim();
  };

  const prefix = radios.namePrefix || inputs['prefix-other-input'] || 'Mr.';
  const firstName = applicant.firstName || inputs['raw-first-name'] || '';
  const middleName = inputs['raw-middle-name'] || '';
  const lastName = applicant.lastName || inputs['raw-last-name'] || '';
  const previousName = inputs['raw-previous-name'] || '';
  const dob = applicant.dob || inputs['raw-dob-date'] || '';
  const gender = radios.genderRadio || 'MALE';
  const marital = radios.maritalRadio || 'MARRIED';
  const nationality = radios.nationalityRadio || 'IN - Indian';
  const fatherName = inputs['raw-father-name'] || '';
  const motherName = inputs['raw-mother-name'] || '';
  const spouseName = inputs['raw-spouse-name'] || '';
  const guardianName = inputs['raw-guardian-name'] || '';

  const panNumber = payload.taxId || inputs['raw-pan-number'] || '';
  const aadhaarNumber = idDoc.number || inputs['raw-aadhaar-number'] || '';
  const form60 = radios.form60Radio === 'YES' ? 'YES (Exemption Claimed)' : 'NO';
  const idDocType = idDoc.type || radios.idDocTypeRadio || 'NATIONAL_ID / AADHAAR';
  const addrDocType = addrDoc.type || radios.addrDocTypeRadio || 'OVD CERTIFIED';

  const phone = applicant.phone || inputs['raw-mobile-number'] || '';
  const altPhone = inputs['raw-alt-mobile-number'] || '';
  const email = payload.email || inputs['hidden-combined-email'] || inputs['email-username'] || '';

  const fullStreet = addr.line1 || inputs['input-addr-house'] || '';
  const city = addr.city || inputs['input-city'] || '';
  const state = inputs['input-state'] || '';
  const postalCode = addr.postalCode || inputs['raw-pincode'] || '';
  const country = addr.country || 'India';

  const accountType = payload.accountType || window.selectedAccountType || 'SAVINGS';
  const deposit = payload.initialDeposit !== undefined ? `₹ ${Number(payload.initialDeposit).toFixed(2)}` : '₹ 0.00';
  const branchName = payload.branchName || 'Downtown Main Branch';
  const branchCode = payload.branchCode || 'BR001';
  const empStatus = emp.status || radios.empStatusRadio || 'EMPLOYED';
  const employer = emp.employer || inputs['input-employer-name'] || 'FinTech Ltd';
  const annualIncome = emp.annualIncome ? `₹ ${Number(emp.annualIncome).toLocaleString()}/year` : '';
  const incomeBracket = radios.incomeBracketRadio || '';
  const sourceFunds = radios.sourceFundsRadio || '';
  const cardScheme = payload.cardScheme || radios.cardSchemeRadio || 'RUPAY';
  const cardFormat = payload.cardFormat || radios.cardFormatRadio || 'BOTH (Virtual + Metal)';

  const nomChoice = radios.nominationChoiceRadio || 'REGISTER';
  const nomName = (nomChoice === 'REGISTER') ? (inputs['raw-nominee-name'] || '') : '';
  const nomRel = (nomChoice === 'REGISTER') ? (inputs['select-nominee-relationship'] || inputs['raw-nominee-rel'] || '') : '';
  const nomAge = (nomChoice === 'REGISTER') ? (inputs['nomineeAge'] || '') : '';
  const nomAddr = (nomChoice === 'REGISTER') ? (inputs['nomineeAddress'] || '') : '';
  const fatca = radios.fatcaRadio ? radios.fatcaRadio.toUpperCase() : 'NO';

  const modeVal = radios.modeOperationRadio || 'SELF_SINGLE';
  const jointCount = (modeVal === 'JOINTLY') ? parseInt(inputs['input-joint-members-count'] || '2', 10) : 1;

  let jointHtml = '';
  if (jointCount >= 2) {
    jointHtml = `
      <div class="app-summary-section">
        <div class="app-summary-section-header">
          <span>👥</span>
          <span>Joint &amp; Secondary Applicant Profiles (${jointCount - 1} Co-Applicant(s))</span>
        </div>
    `;

    for (let i = 2; i <= jointCount; i++) {
      const suffix = (i === 2) ? '2nd' : (i === 3) ? '3rd' : `${i}th`;
      const jRel = selects[`joint${i}Relationship`] || inputs[`joint${i}Relationship`] || '';
      const jFirst = inputs[`raw-joint${i}-first-name`] || inputs[`joint${i}FirstName`] || '';
      const jMiddle = inputs[`raw-joint${i}-middle-name`] || inputs[`joint${i}MiddleName`] || '';
      const jLast = inputs[`raw-joint${i}-last-name`] || inputs[`joint${i}LastName`] || '';
      const jPrev = inputs[`raw-joint${i}-previous-name`] || inputs[`joint${i}PreviousName`] || '';
      const jDob = inputs[`raw-joint${i}-dob-date`] || inputs[`raw-joint${i}-dob`] || inputs[`joint${i}Dob`] || '';
      const jGender = radios[`joint${i}Gender`] || 'MALE';
      const jMarital = radios[`joint${i}Marital`] || 'MARRIED';
      const jNationality = radios[`joint${i}Nationality`] || 'IN - Indian';
      const jFather = inputs[`raw-joint${i}-father-name`] || inputs[`joint${i}FatherName`] || '';
      const jMother = inputs[`raw-joint${i}-mother-name`] || inputs[`joint${i}MotherName`] || '';
      const jSpouse = inputs[`raw-joint${i}-spouse-name`] || inputs[`joint${i}SpouseName`] || '';
      const jPan = inputs[`raw-joint${i}-pan-number`] || inputs[`joint${i}Pan`] || '';
      const jAadhaar = inputs[`raw-joint${i}-aadhaar-number`] || inputs[`joint${i}Aadhaar`] || '';
      const jPhone = inputs[`raw-joint${i}-mobile-number`] || inputs[`joint${i}Phone`] || '';
      const jEmail = inputs[`joint${i}-email`] || inputs[`joint${i}Email`] || '';

      jointHtml += `
        <div style="margin-bottom:1rem;padding-bottom:0.75rem;border-bottom:1px dashed var(--border-subtle)">
          <div style="font-weight:700;font-size:0.82rem;color:var(--text-main);margin-bottom:0.5rem">
            ${suffix} Co-Applicant Details (#${i})
          </div>
          <div class="app-summary-grid">
            <div class="app-summary-item">
              <span class="app-summary-label">Relationship with Primary</span>
              <span class="app-summary-val" style="color:var(--brand-500)">${formatVal(jRel)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Full Name</span>
              <span class="app-summary-val">${formatVal([jFirst, jMiddle, jLast].filter(Boolean).join(' '))}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Middle Name</span>
              <span class="app-summary-val">${formatVal(jMiddle)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Previous Name</span>
              <span class="app-summary-val">${formatVal(jPrev)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Date of Birth</span>
              <span class="app-summary-val">${formatVal(jDob)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Gender / Marital / Nationality</span>
              <span class="app-summary-val">${formatVal(jGender)} • ${formatVal(jMarital)} • ${formatVal(jNationality)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Father's / Mother's Name</span>
              <span class="app-summary-val">${formatVal(jFather)} / ${formatVal(jMother)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Spouse Name</span>
              <span class="app-summary-val">${formatVal(jSpouse)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Tax ID (PAN) / Aadhaar</span>
              <span class="app-summary-val" style="font-family:monospace">${formatVal(jPan)} / ${formatVal(jAadhaar)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Mobile Number / Email</span>
              <span class="app-summary-val">${formatVal(jPhone)} • ${formatVal(jEmail)}</span>
            </div>
            <div class="app-summary-item">
              <span class="app-summary-label">Verification Specimen</span>
              <span class="app-summary-val" style="color:var(--emerald-400)">Specimen Attached ✓</span>
            </div>
          </div>
        </div>
      `;
    }

    jointHtml += `</div>`;
  }

  container.innerHTML = `
    <!-- Section 1: Personal & Demographic Details -->
    <div class="app-summary-section">
      <div class="app-summary-section-header">
        <span>👤</span>
        <span>Personal &amp; Demographic Details</span>
      </div>
      <div class="app-summary-grid">
        <div class="app-summary-item">
          <span class="app-summary-label">Applicant Full Name</span>
          <span class="app-summary-val">${formatVal(`${prefix} ${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim())}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">First Name</span>
          <span class="app-summary-val">${formatVal(firstName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Middle Name</span>
          <span class="app-summary-val">${formatVal(middleName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Last Name</span>
          <span class="app-summary-val">${formatVal(lastName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Previous / Maiden Name</span>
          <span class="app-summary-val">${formatVal(previousName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Date of Birth (DOB)</span>
          <span class="app-summary-val">${formatVal(dob)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Gender</span>
          <span class="app-summary-val">${formatVal(gender)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Marital Status</span>
          <span class="app-summary-val">${formatVal(marital)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Nationality</span>
          <span class="app-summary-val">${formatVal(nationality)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Father's Name</span>
          <span class="app-summary-val">${formatVal(fatherName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Mother's Name</span>
          <span class="app-summary-val">${formatVal(motherName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Spouse Name</span>
          <span class="app-summary-val">${formatVal(spouseName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Guardian Name (Minor)</span>
          <span class="app-summary-val">${formatVal(guardianName)}</span>
        </div>
      </div>
    </div>

    <!-- Section 2: Identification, Tax & KYC Documentation -->
    <div class="app-summary-section">
      <div class="app-summary-section-header">
        <span>🪪</span>
        <span>Identification, Tax &amp; KYC Documentation</span>
      </div>
      <div class="app-summary-grid">
        <div class="app-summary-item">
          <span class="app-summary-label">Tax ID (PAN Number)</span>
          <span class="app-summary-val" style="font-family:monospace">${formatVal(panNumber)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Aadhaar / National ID</span>
          <span class="app-summary-val" style="font-family:monospace">${formatVal(aadhaarNumber)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Form 60 Declaration</span>
          <span class="app-summary-val">${formatVal(form60)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Primary ID Proof Category</span>
          <span class="app-summary-val">${formatVal(idDocType)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Address Proof Document Type</span>
          <span class="app-summary-val">${formatVal(addrDocType)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Residential Address</span>
          <span class="app-summary-val">${formatVal(fullStreet)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">City, State &amp; Country</span>
          <span class="app-summary-val">${formatVal(`${city}${state ? ', ' + state : ''}, ${country}`)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Postal / PIN Code</span>
          <span class="app-summary-val" style="font-family:monospace">${formatVal(postalCode)}</span>
        </div>
      </div>
    </div>

    <!-- Section 3: Contact Details -->
    <div class="app-summary-section">
      <div class="app-summary-section-header">
        <span>📞</span>
        <span>Contact Information</span>
      </div>
      <div class="app-summary-grid">
        <div class="app-summary-item">
          <span class="app-summary-label">Primary Mobile Number</span>
          <span class="app-summary-val">${formatVal(phone)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Alternate Mobile / Landline</span>
          <span class="app-summary-val">${formatVal(altPhone)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Email Address</span>
          <span class="app-summary-val">${formatVal(email)}</span>
        </div>
      </div>
    </div>

    <!-- Section 4: Account Specifications & Banking Facilities -->
    <div class="app-summary-section">
      <div class="app-summary-section-header">
        <span>🏦</span>
        <span>Account Specifications &amp; Banking Facilities</span>
      </div>
      <div class="app-summary-grid">
        <div class="app-summary-item">
          <span class="app-summary-label">Account Product</span>
          <span class="app-summary-val" style="color:var(--brand-500)">${formatVal(formatHumanText(accountType))}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Initial Opening Deposit</span>
          <span class="app-summary-val" style="color:var(--emerald-400)">${formatVal(deposit)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Assigned Branch &amp; Code</span>
          <span class="app-summary-val">${formatVal(`${branchName} (${branchCode})`)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Occupation Status</span>
          <span class="app-summary-val">${formatVal(formatHumanText(empStatus))}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Employer / Business Name</span>
          <span class="app-summary-val">${formatVal(employer)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Gross Annual Income</span>
          <span class="app-summary-val">${formatVal(annualIncome)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Income Bracket</span>
          <span class="app-summary-val">${formatVal(incomeBracket)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Source of Funds</span>
          <span class="app-summary-val">${formatVal(sourceFunds)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Debit Card Network</span>
          <span class="app-summary-val">${formatVal(cardScheme)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Card Delivery Format</span>
          <span class="app-summary-val">${formatVal(cardFormat)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Digital Banking Facilities</span>
          <span class="app-summary-val" style="color:var(--emerald-400)">NetBanking • Mobile • SMS Alerts ✓</span>
        </div>
      </div>
    </div>

    <!-- Section 5: Nomination & Regulatory Declarations -->
    <div class="app-summary-section">
      <div class="app-summary-section-header">
        <span>📜</span>
        <span>Nomination, Declarations &amp; Verification Signatures</span>
      </div>
      <div class="app-summary-grid">
        <div class="app-summary-item">
          <span class="app-summary-label">Nomination Registration</span>
          <span class="app-summary-val">${nomChoice === 'REGISTER' ? 'REGISTERED' : 'OPTED OUT'}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Nominee Full Name</span>
          <span class="app-summary-val">${formatVal(nomName)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Nominee Relationship</span>
          <span class="app-summary-val">${formatVal(nomRel)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Nominee Age / DOB</span>
          <span class="app-summary-val">${formatVal(nomAge)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Nominee Address</span>
          <span class="app-summary-val">${formatVal(nomAddr)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">FATCA Foreign Tax Liability</span>
          <span class="app-summary-val">${formatVal(fatca)}</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Applicant Declaration</span>
          <span class="app-summary-val" style="color:var(--emerald-400)">Statutory Consent Given ✓</span>
        </div>
        <div class="app-summary-item">
          <span class="app-summary-label">Specimen Verification</span>
          <span class="app-summary-val" style="color:var(--emerald-400)">Verified Specimen Captured ✓</span>
        </div>
      </div>
    </div>

    <!-- Joint Applicant Section (if applicable) -->
    ${jointHtml}
  `;
}

// Upload mock files to SQL AES-256 document vault
async function uploadMockDocuments(appNum, form) {
  try {
    const fileIdBlob = new Blob([`Identity Document: ${form.idDocType.value} #${form.idDocNumber.value}`], { type: 'text/plain' });
    const formDataId = new FormData();
    formDataId.append('file', fileIdBlob, `identity_${form.idDocType.value.toLowerCase()}.txt`);
    formDataId.append('applicationNumber', appNum);
    formDataId.append('docCategory', 'IDENTITY');
    formDataId.append('docType', form.idDocType.value);
    formDataId.append('docNumber', form.idDocNumber.value);

    await fetch(`${API_BASE}/onboarding/upload-document`, {
      method: 'POST',
      body: formDataId
    });

    const fileAddrBlob = new Blob([`Address Document: ${form.addrDocType.value} #${form.addrDocNumber.value}`], { type: 'text/plain' });
    const formDataAddr = new FormData();
    formDataAddr.append('file', fileAddrBlob, `proof_of_address.txt`);
    formDataAddr.append('applicationNumber', appNum);
    formDataAddr.append('docCategory', 'ADDRESS');
    formDataAddr.append('docType', form.addrDocType.value);
    formDataAddr.append('docNumber', form.addrDocNumber.value);

    await fetch(`${API_BASE}/onboarding/upload-document`, {
      method: 'POST',
      body: formDataAddr
    });
  } catch (e) {
    console.warn('Document vault background sync note:', e);
  }
}

// ----------------------------------------------------------------- TRACK APPLICATION BY NUMBER
async function trackCustomerApplication() {
  const input = document.getElementById('track-app-number-input');
  const container = document.getElementById('track-result-container');
  if (!input || !container) return;

  const appNum = input.value.trim().toUpperCase();
  if (!appNum) {
    showToast('Please enter an application reference number', 'info');
    return;
  }

  container.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text-muted)">Querying SQL relational ledger for ${appNum}...</div>`;

  try {
    const res = await api(`/onboarding/track/${appNum}`);
    if (!res || !res.applicationNumber) {
      container.innerHTML = `
        <div class="glass-card" style="padding:2rem;text-align:center;border-color:rgba(244,63,94,0.3)">
          <div style="font-size:2rem;color:var(--rose-500);margin-bottom:0.5rem"></div>
          <h3 style="color:var(--text-contrast);margin-bottom:0.5rem">Application Not Found</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary)">No record matching "${appNum}" was found in the database. Please check your reference code.</p>
        </div>
      `;
      return;
    }

    let docsHtml = '';
    if (res.documents && res.documents.length > 0) {
      docsHtml = `
        <div style="margin-top:1.25rem;border-top:1px solid var(--border-subtle);padding-top:1rem">
          <div style="font-size:0.8rem;font-weight:700;color:var(--text-secondary);margin-bottom:0.5rem">Vault Encrypted Documents (AES-256):</div>
          <div style="display:flex;flex-direction:column;gap:0.5rem">
            ${res.documents.map(d => `
              <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);padding:0.6rem 0.85rem;border-radius:8px;font-size:0.8rem">
                <div>
                  <span style="font-weight:600;color:inherit">${d.file_name}</span>
                  <span style="font-size:0.7rem;color:var(--text-muted);margin-left:0.5rem">[${formatHumanText(d.doc_category)}]</span>
                </div>
                <a href="${API_BASE}/onboarding/documents/${d.doc_id}/download" target="_blank" class="btn btn-outline btn-sm" style="padding:0.25rem 0.5rem;font-size:0.7rem">
                  Decrypt & View
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="glass-card" style="padding:2rem;border-radius:18px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem">
          <div>
            <span style="font-size:0.75rem;color:var(--text-muted)">Application Reference (SQL Ledger)</span>
            <div style="font-size:1.25rem;font-weight:800;color:inherit;font-family:monospace">${res.applicationNumber}</div>
          </div>
          <span class="status-pill ${res.status.toLowerCase()}">${formatHumanText(res.status)}</span>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.85rem;margin-bottom:1rem">
          <div><span style="color:var(--text-secondary)">Applicant:</span> <strong style="color:inherit">${res.applicantName}</strong></div>
          <div><span style="color:var(--text-secondary)">Account:</span> <strong style="color:inherit">${formatHumanText(res.accountType)}</strong></div>
          <div><span style="color:var(--text-secondary)">Submitted:</span> <span>${res.submittedAt ? res.submittedAt.slice(0, 10) : ''}</span></div>
          <div><span style="color:var(--text-secondary)">Review Date:</span> <span>${res.reviewedAt ? res.reviewedAt.slice(0, 10) : 'Pending review'}</span></div>
        </div>

        ${docsHtml}

        ${(res.status === 'DRAFT_INITIATED' || res.status === 'DRAFT_SAVED' || res.isDraft) ? `
          <div style="background:rgba(99,102,241,0.12);border:1px solid var(--border-glow);padding:1.25rem;border-radius:12px;margin-top:1rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
            <div>
              <div style="font-weight:700;color:var(--brand-200);font-size:0.95rem">
                ${res.status === 'DRAFT_SAVED' ? 'Draft Application Saved' : 'Application Initiated (Incomplete)'}
              </div>
              <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem">
                ${res.status === 'DRAFT_SAVED' ? 'Your draft was saved with your details. Click below to resume and finalize.' : 'Your Application Number is locked. Complete the uniform bank form to submit your application.'}
              </div>
            </div>
            <a href="/open_account_customer?app=${encodeURIComponent(res.applicationNumber)}" class="btn btn-primary btn-sm" style="padding:0.5rem 1.25rem;font-size:0.85rem;border-radius:8px">
              Resume Application →
            </a>
          </div>
        ` : res.status === 'ACCOUNT_OPENED' ? `
          <div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);padding:1rem;border-radius:8px;text-align:center;margin-top:1rem">
            <div style="font-weight:800;color:inherit;margin-top:0.25rem">Account Provisioned Successfully!</div>
            <div style="font-size:0.9rem;color:var(--emerald-400);font-family:monospace;margin:0.25rem 0">Account #: <strong>${res.generatedAccountNumber}</strong></div>
            <a href="/login" class="btn btn-success btn-sm" style="margin-top:0.5rem;display:inline-block">Sign In to Online Banking</a>
          </div>
        ` : res.status === 'REJECTED' ? `
          <div style="background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.25);padding:0.85rem;border-radius:8px;color:var(--rose-500);font-size:0.85rem;margin-top:1rem">
            <strong>Rejection Reason:</strong> ${res.reviewNotes || 'Does not meet eligibility standards.'}
          </div>
        ` : `
          <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);padding:0.85rem;border-radius:8px;color:var(--amber-400);font-size:0.85rem;margin-top:1rem">
            Your application is undergoing background KYC and compliance verification. You will be notified once reviewed.
          </div>
        `}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div class="glass-card" style="padding:1.5rem;color:var(--rose-500)">
        Error communicating with ledger: ${err.message || 'Unknown error'}
      </div>
    `;
  }
}

// Auto-boot on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    loadAccountCatalog();
    adaptFieldsForAccountType(selectedAccountType);
    initPaperForm();
    if (typeof detectAndLoadApplicationFromUrl === 'function') {
      await detectAndLoadApplicationFromUrl();
    }
  });
} else {
  loadAccountCatalog();
  adaptFieldsForAccountType(selectedAccountType);
  initPaperForm();
  if (typeof detectAndLoadApplicationFromUrl === 'function') {
    detectAndLoadApplicationFromUrl();
  }
}

// ----------------------------------------------------------------- ITEM 5 & 6: PASSWORD TOGGLE & SUBMISSION POPUP
function toggleOnboardingPasswordVisibility() {
  const pwd = document.getElementById('input-onboarding-password');
  const btn = document.getElementById('btn-toggle-onboarding-pwd');
  if (!pwd) return;
  if (pwd.type === 'password') {
    pwd.type = 'text';
    if (btn) btn.textContent = '';
  } else {
    pwd.type = 'password';
    if (btn) btn.textContent = '';
  }
}

function openSubmissionGuidanceModal(appNumber, email, phone) {
  const modal = document.getElementById('modal-submission-guidance');
  if (!modal) return;
  const appEl = document.getElementById('popup-app-number');
  if (appEl) appEl.textContent = appNumber;
  const emailEl = document.getElementById('popup-user-email');
  if (emailEl) emailEl.textContent = email || 'your email';
  const phoneEl = document.getElementById('popup-user-phone');
  if (phoneEl) phoneEl.textContent = phone || 'your phone number';

  const trackUrl = `${window.location.origin}/existing_application?app=${appNumber}`;
  const trackLink = document.getElementById('popup-track-link');
  if (trackLink) {
    trackLink.href = trackUrl;
    trackLink.textContent = trackUrl;
  }
  const trackBtn = document.getElementById('popup-btn-track-now');
  if (trackBtn) {
    trackBtn.href = trackUrl;
    trackBtn.target = '_blank';
  }

  modal.style.display = 'flex';
  modal.scrollTop = 0;
  if (document.body) document.body.classList.add('modal-open');
  modal.classList.add('active');
}

function closeSubmissionGuidanceModal() {
  const modal = document.getElementById('modal-submission-guidance');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
      const remaining = document.querySelectorAll('.modal-overlay.active, .signature-modal-backdrop.active, .db-modal-overlay.active');
      if (remaining.length === 0 && document.body) document.body.classList.remove('modal-open');
    }, 200);
  }
}

function copyPopupTrackingLink() {
  const trackLink = document.getElementById('popup-track-link');
  const url = trackLink ? trackLink.href : window.location.href;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('✓ Tracking link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Tracking URL: ' + url, 'info');
    });
  } else {
    showToast('Tracking URL: ' + url, 'info');
  }
}
