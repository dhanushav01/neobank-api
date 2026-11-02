/**
 * NeoBank Core Banking Platform - Box Input Module
 * Dedicated handler for segmented character-by-character bank box inputs.
 * Preserves exact sizing (29px height, inline-flex, fit-content), caret highlighting,
 * and field-specific sanitization.
 */
(function(window) {
  'use strict';

  function initBankBoxInputs() {
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

      // Check if custom segmented markup already exists
      const hasStaticCells = cellsContainer.querySelectorAll('.char-cell').length > 0;
      if (!hasStaticCells) {
        let cellsHtml = '';
        if (boxCount === 12 && targetName === 'aadhaarNumber') {
          for (let i = 0; i < 12; i++) {
            if (i === 4 || i === 8) {
              cellsHtml += '<span class="date-separator notranslate" translate="no" style="margin:0 2px">-</span>';
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
          if (typeof window.syncApplicantFullName === 'function') {
            window.syncApplicantFullName();
          }
        }

        if (typeof window.clearErrorOnValidInput === 'function') {
          window.clearErrorOnValidInput(e.target);
        }

        if (typeof window.debounceSaveDraft === 'function') {
          window.debounceSaveDraft();
        }
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

  function updateLimitIndicator(wrap, val) {
    const input = wrap.querySelector('.bank-box-input');
    if (!input) return;
    const parent = wrap.closest('.char-input-group') || wrap.parentElement;
    if (!parent) return;

    let hintEl = parent.querySelector(`.char-box-limit-hint[data-target-input="${input.id || ''}"]`);
    if (!hintEl) {
      hintEl = parent.querySelector('.char-box-limit-hint');
    }

    const currentLen = (val || '').length;
    if (hintEl) {
      const countEl = hintEl.querySelector('.char-count-current');
      const counterBadge = hintEl.querySelector('.char-limit-counter');
      if (countEl) countEl.textContent = String(currentLen);
      if (counterBadge) {
        if (currentLen >= 50) {
          counterBadge.classList.add('limit-reached');
        } else {
          counterBadge.classList.remove('limit-reached');
        }
      }
    }
  }

  function updateBoxCells(wrap, text) {
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

      updateLimitIndicator(wrap, str);
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

  window._boxInputModuleLoaded = true;
  window.initBankBoxInputsModular = initBankBoxInputs;
  window.initBankBoxInputs = initBankBoxInputs;
  window.updateBoxCellsModular = updateBoxCells;
  window.updateBoxCells = updateBoxCells;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBankBoxInputs);
    } else {
      initBankBoxInputs();
    }
  }

})(typeof window !== 'undefined' ? window : this);
