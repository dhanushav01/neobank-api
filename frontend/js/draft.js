/**
 * NeoBank Core Banking Platform - Draft Management Module
 * Handles auto-save, draft persistence to LocalStorage and backend API,
 * form data extraction, draft restoration, and isolated draft purging.
 */
(function(window) {
  'use strict';

  let draftSaveTimeout = null;

  function getDraftStorageKey(appNum) {
    const num = appNum || window.currentApplicationNumber;
    return num ? `neobank_form_draft_${num}` : 'neobank_form_draft_default';
  }

  function debounceSaveDraft() {
    if (window.isApplicationSubmitted || !window.currentApplicationNumber) return;
    if (draftSaveTimeout) clearTimeout(draftSaveTimeout);
    draftSaveTimeout = setTimeout(() => {
      if (!window.isApplicationSubmitted && window.currentApplicationNumber && typeof window.saveCustomerFormDraft === 'function') {
        window.saveCustomerFormDraft(false);
      }
    }, 1000);
  }

  function extractFullFormData(form) {
    if (!form) form = document.getElementById('form-customer-application');
    if (!form) return {};

    const data = {
      applicationNumber: window.currentApplicationNumber,
      accountType: window.selectedAccountType || 'SAVINGS',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      inputs: {},
      radios: {},
      checkboxes: {},
      selects: {}
    };

    // Save all text & hidden inputs
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
    data.customEmailDomain = window.previousEmailDomain;

    return data;
  }

  async function saveCustomerFormDraft(notify = true) {
    if (window.isApplicationSubmitted) return;
    try {
      const form = document.getElementById('form-customer-application');
      if (!form) return;

      const data = extractFullFormData(form);

      // Guard: Do not attempt to save or initiate draft on backend before Step 1 is completed
      if (!window.currentApplicationNumber) return;

      // Security: Strictly avoid caching sensitive PII / drafts in browser localStorage
      try {
        const storageKey = getDraftStorageKey(window.currentApplicationNumber);
        localStorage.removeItem(storageKey);
      } catch (_) {}

      // Persist draft to backend if currentApplicationNumber exists
      if (window.currentApplicationNumber && typeof window.api === 'function') {
        const branchSelect = document.getElementById('step2-branch-select') || document.getElementById('step1-branch-select');
        const branchName = branchSelect ? branchSelect.value : '';
        const branchCode = document.getElementById('step2-branch-code')?.value || document.getElementById('step1-branch-code')?.value || '';
        const secret = window.currentDraftSecret || (function() {
          try { return sessionStorage.getItem('draft_secret_' + window.currentApplicationNumber); } catch (_) { return ''; }
        })() || '';
        try {
          await window.api('/onboarding/save-draft', {
            method: 'POST',
            headers: secret ? { 'X-Draft-Secret': secret } : {},
            body: {
              applicationNumber: window.currentApplicationNumber,
              draftSecret: secret,
              accountType: window.selectedAccountType || 'SAVINGS',
              branchName: branchName,
              branchCode: branchCode,
              formData: data
            }
          });
        } catch (backendErr) {
          console.warn('Backend draft sync note:', backendErr);
        }
      }

      // Update draft timestamp indicator
      const ind = document.getElementById('draft-status-indicator');
      const tsEl = document.getElementById('draft-saved-timestamp');
      if (ind && tsEl) {
        tsEl.textContent = data.timestamp;
        ind.style.display = 'block';
      }

      if (notify && typeof window.showToast === 'function') {
        window.showToast('Form draft saved! Application Number: ' + (window.currentApplicationNumber || 'Draft') + ' (Track & resume anytime)', 'success');
      }
    } catch (e) {
      console.warn('Failed to save draft:', e);
    }
  }

  async function loadCustomerFormDraft(targetAppNum) {
    try {
      const num = targetAppNum || window.currentApplicationNumber;
      if (num) {
        window.currentApplicationNumber = num;
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

      if (!data && num && typeof window.api === 'function') {
        try {
          const backendRes = await window.api(`/onboarding/draft/${num}`);
          if (backendRes) {
            data = backendRes.formData || {};
            if (backendRes.accountType && typeof window.selectAccountType === 'function') {
              window.selectAccountType(backendRes.accountType);
            }
            if (backendRes.branchName && typeof window.syncBranchSelection === 'function') {
              window.syncBranchSelection(backendRes.branchName);
            }
          }
        } catch (err) {
          console.warn('Could not load draft from backend:', err);
        }
      }

      if (!data) return false;

      const form = document.getElementById('form-customer-application');
      if (!form) return false;

      const activeUserLang = localStorage.getItem('neobank_lang');
      if (!activeUserLang && data.language && typeof window.handleLanguageChange === 'function') {
        window.handleLanguageChange(data.language, false);
      }

      if (data.accountType && typeof window.selectAccountType === 'function') {
        window.selectAccountType(data.accountType);
      }

      if (data.jointMembersCount && typeof window.handleModeOperationChange === 'function') {
        const modeRadio = document.querySelector('input[name="modeOperationRadio"][value="JOINTLY"]');
        if (modeRadio) {
          modeRadio.checked = true;
          window.handleModeOperationChange('JOINTLY');
          if (typeof window.setJointMembersCount === 'function') {
            window.setJointMembersCount(data.jointMembersCount);
          }
        }
      }

      // Restore text inputs
      if (data.inputs) {
        Object.keys(data.inputs).forEach(key => {
          const inp = form.querySelector(`input[name="${key}"]`) || document.getElementById(key);
          if (inp && data.inputs[key] !== undefined) {
            inp.value = data.inputs[key];
            const wrap = inp.closest('.bank-box-wrap');
            if (wrap && typeof window.updateBoxCells === 'function') {
              window.updateBoxCells(wrap, inp.value);
            }
          }
        });
      }

      // Ensure middle name input is visible
      const middleInputWrap = document.getElementById('middle-name-input-wrap');
      if (middleInputWrap) middleInputWrap.style.display = 'inline-flex';

      // Restore email username and domain
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
                window.previousEmailDomain = domain;
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
              window.previousEmailDomain = domain;
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

      // Restore photo & signature
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

      if (typeof window.syncApplicantFullName === 'function') {
        window.syncApplicantFullName();
      }
      if (typeof window.initCustomFlagDropdowns === 'function') {
        window.initCustomFlagDropdowns();
      }
      if (typeof window.updateLiveMissingCounters === 'function') {
        window.updateLiveMissingCounters();
      }
      return true;
    } catch (e) {
      console.warn('Failed to load draft:', e);
      return false;
    }
  }

  function confirmClearAllForm() {
    const confirmed = confirm('Are you sure you want to clear all entered data for this application? This will reset all fields and remove this application draft.');
    if (!confirmed) return;

    try {
      const key = getDraftStorageKey();
      localStorage.removeItem(key);
      const form = document.getElementById('form-customer-application');
      if (form) {
        form.reset();

        form.querySelectorAll('.bank-box-wrap').forEach(wrap => {
          const input = wrap.querySelector('.bank-box-input');
          if (input) input.value = '';
          if (typeof window.updateBoxCells === 'function') {
            window.updateBoxCells(wrap, '');
          }
        });

        const previewPhoto = document.getElementById('passport-photo-img');
        const placeholderPhoto = document.getElementById('passport-photo-placeholder');
        const stampBadge = document.getElementById('passport-stamp-badge');
        const hiddenPhoto = document.getElementById('input-applicant-photo-data');
        if (previewPhoto) { previewPhoto.src = ''; previewPhoto.style.display = 'none'; }
        if (placeholderPhoto) placeholderPhoto.style.display = 'flex';
        if (stampBadge) stampBadge.style.display = 'none';
        if (hiddenPhoto) hiddenPhoto.value = '';

        const previewSig = document.getElementById('form-signature-preview');
        const placeholderSig = document.getElementById('form-signature-placeholder');
        const hiddenSig = document.getElementById('input-applicant-signature-data');
        const hiddenThumb = document.getElementById('input-applicant-thumb-data');
        if (previewSig) { previewSig.src = ''; previewSig.style.display = 'none'; }
        if (placeholderSig) placeholderSig.style.display = 'flex';
        if (hiddenSig) hiddenSig.value = '';
        if (hiddenThumb) hiddenThumb.value = '';

        const ind = document.getElementById('draft-status-indicator');
        if (ind) ind.style.display = 'none';

        if (typeof window.selectAccountType === 'function') {
          window.selectAccountType('SAVINGS');
        }
        if (typeof window.syncApplicantFullName === 'function') {
          window.syncApplicantFullName();
        }
        if (typeof window.initCustomFlagDropdowns === 'function') {
          window.initCustomFlagDropdowns();
        }
        if (typeof window.updateLiveMissingCounters === 'function') {
          window.updateLiveMissingCounters();
        }
        if (typeof window.refreshMissingBadges === 'function') {
          window.refreshMissingBadges();
        }
        if (typeof window.showToast === 'function') {
          window.showToast('Application form cleared.', 'info');
        }
      }
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  }

  window.getDraftStorageKey = getDraftStorageKey;
  window.debounceSaveDraft = debounceSaveDraft;
  window.extractFullFormData = extractFullFormData;
  window.saveCustomerFormDraft = saveCustomerFormDraft;
  window.loadCustomerFormDraft = loadCustomerFormDraft;
  window.confirmClearAllForm = confirmClearAllForm;

})(typeof window !== 'undefined' ? window : this);
