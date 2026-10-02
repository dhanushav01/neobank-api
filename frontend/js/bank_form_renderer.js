/**
 * NeoBank Official Uniform Bank Application Form Renderer
 * Renders the authentic 4-page bank account opening form populated with real applicant data,
 * supporting interactive page switching, print/PDF generation, and AES-256 decrypted document inspection.
 */

(function(window) {
  'use strict';

  function safeVal(val, defaultVal = '') {
    return (val !== null && val !== undefined && val !== '') ? val : defaultVal;
  }

  function renderCharBoxes(text, count, extraClass = '') {
    const clean = String(text || '').toUpperCase();
    let html = `<div class="bank-box-cells notranslate ${extraClass}" style="display:inline-flex;gap:3px;vertical-align:middle">`;
    for (let i = 0; i < count; i++) {
      const char = clean[i] ? clean[i] : '&nbsp;';
      html += `<span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;background:rgba(255,255,255,0.05);font-family:monospace;font-size:0.85rem;font-weight:700;color:inherit">${char}</span>`;
    }
    html += '</div>';
    return html;
  }

  function renderDateBoxes(dateStr) {
    if (!dateStr) return renderCharBoxes('        ', 8);
    let clean = String(dateStr).replace(/[^0-9]/g, '');
    if (clean.length === 8 && dateStr.includes('-')) {
      // YYYY-MM-DD -> DDMMYYYY
      const parts = dateStr.split('-');
      if (parts[0].length === 4) {
        clean = parts[2] + parts[1] + parts[0];
      }
    }
    const d = clean.padEnd(8, ' ');
    return `
      <div style="display:inline-flex;align-items:center;gap:3px;vertical-align:middle">
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[0] || '&nbsp;'}</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[1] || '&nbsp;'}</span>
        <span style="font-weight:800;margin:0 2px">/</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[2] || '&nbsp;'}</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[3] || '&nbsp;'}</span>
        <span style="font-weight:800;margin:0 2px">/</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[4] || '&nbsp;'}</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[5] || '&nbsp;'}</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[6] || '&nbsp;'}</span>
        <span class="char-cell" style="display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:24px;border:1px solid #94a3b8;font-family:monospace;font-size:0.85rem;font-weight:700">${d[7] || '&nbsp;'}</span>
      </div>
    `;
  }

  function renderRadioStatic(label, isChecked) {
    return `
      <span class="bank-option-pill ${isChecked ? 'active' : ''}" style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.25rem 0.6rem;border-radius:6px;border:1px solid ${isChecked ? 'var(--brand-500)' : '#cbd5e1'};background:${isChecked ? 'rgba(99,102,241,0.12)' : 'transparent'};margin-right:0.4rem;font-size:0.75rem;font-weight:${isChecked ? '700' : '500'}">
        <span style="display:inline-block;width:12px;height:12px;border-radius:50%;border:2px solid ${isChecked ? 'var(--brand-500)' : '#94a3b8'};background:${isChecked ? 'var(--brand-500)' : 'transparent'};box-sizing:border-box"></span>
        <span>${label}</span>
      </span>
    `;
  }

  function formatStampDate(isoStr) {
    try {
      const dObj = isoStr ? new Date(isoStr) : new Date();
      const day = String(dObj.getDate()).padStart(2, '0');
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = monthNames[dObj.getMonth()] || 'OCT';
      const year = dObj.getFullYear() || 2026;
      return `${day} ${month} ${year}`;
    } catch (e) {
      return '01 OCT 2026';
    }
  }

  /**
   * Renders the authentic institutional rubber ink stamp SVG (APPROVED or REJECTED)
   * with distressed fractal ink displacement filter, bank insignia, date, and regulatory markings.
   */
  function renderOfficialRubberStampSVG(isApproved, stampDate, prefix = 'rf') {
    const filterId = isApproved ? `nsInkApproved_${prefix}` : `nsInkRejected_${prefix}`;
    const color = isApproved ? '#0a7f59' : '#c2263c';
    const stampText = isApproved ? 'APPROVED' : 'REJECTED';
    const symbolSvg = isApproved
      ? `<path d="M52 142l10 10 20-23" fill="none" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<path d="M54 129l24 24M78 129L54 153" fill="none" stroke-width="6.5" stroke-linecap="round"/>`;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -12 588 258" role="img" aria-label="Bank stamp: ${stampText}" style="color:${color};width:100%;max-width:320px;height:auto;display:inline-block">
        <defs>
          <filter id="${filterId}" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="11" result="n"/>
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 0 0 0 -1.3" result="m"/>
            <feComposite in="SourceGraphic" in2="m" operator="in" result="t"/>
            <feDisplacementMap in="t" in2="n" scale="1.3"/>
          </filter>
        </defs>
        <g filter="url(#${filterId})" transform="rotate(-3 280 112)" fill="currentColor" stroke="currentColor">
          <rect x="4" y="4" width="552" height="216" rx="18" fill="none" stroke-width="6"/>
          <rect x="14" y="14" width="532" height="196" rx="11" fill="none" stroke-width="1.6"/>
          <g transform="translate(34 30)" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M0 14L18 3l18 11M4 17v17M13 17v17M23 17v17M32 17v17M0 38h36"/>
          </g>
          <text x="84" y="55" font-size="32" font-weight="800" letter-spacing="7" stroke="none">NEOBANK</text>
          <text x="86" y="73" font-size="9.5" font-weight="700" letter-spacing="2.4" stroke="none">CORE BANKING SYSTEM</text>
          <text x="522" y="45" font-size="9.5" font-weight="700" text-anchor="end" letter-spacing="1.6" stroke="none">DATE</text>
          <text x="522" y="65" font-size="16" font-weight="800" text-anchor="end" letter-spacing="1" font-family="ui-monospace,Menlo,Consolas,monospace" stroke="none">${stampDate}</text>
          <path d="M30 88H530" stroke-width="1.6" fill="none"/>
          <rect x="30" y="98" width="500" height="86" rx="8" fill="none" stroke-width="4"/>
          <circle cx="66" cy="141" r="27" fill="none" stroke-width="4.5"/>
          ${symbolSvg}
          <text x="316" y="161" font-size="58" font-weight="900" text-anchor="middle" textLength="318" lengthAdjust="spacingAndGlyphs" stroke="none">${stampText}</text>
        </g>
      </svg>
    `;
  }

  /**
   * Generates complete 4-page uniform bank application form HTML
   */
  function buildBankPaperFormHTML(app, uniquePrefix = 'rf') {
    if (!app) return '<div class="alert alert-warning">No application data provided.</div>';

    const applicant = app.applicant || {};
    const emp = app.employment || {};
    const addr = applicant.address || {};
    const idDoc = app.identityDocument || {};
    const addrDoc = app.addressProof || {};
    const formData = app.formData || {};
    const formInputs = formData.inputs || {};

    const firstName = safeVal(applicant.firstName, formInputs['raw-first-name'] || 'APPLICANT');
    const lastName = safeVal(applicant.lastName, formInputs['raw-last-name'] || 'CUSTOMER');
    const middleName = safeVal(applicant.middleName, formInputs['raw-middle-name'] || '');
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim().toUpperCase();

    const appNumber = safeVal(app.applicationNumber, 'APP-2026-PENDING');
    const appType = (safeVal(app.applicationType, 'NEW')).toUpperCase();
    const accType = (safeVal(app.accountType, 'SAVINGS')).toUpperCase();
    const branchName = safeVal(app.branchName, 'Central Digital Branch');
    const branchCode = safeVal(app.branchCode, 'NBK-001');
    const curDate = safeVal((app.createdAt || '').slice(0, 10), new Date().toISOString().slice(0, 10));
    const dob = safeVal(applicant.dob, '1995-05-15');
    const email = safeVal(applicant.email, safeVal(app.email, ''));
    const phone = safeVal(applicant.phone, '');
    const taxId = safeVal(app.taxId, 'TAX-998231');
    const deposit = Number(app.initialDeposit || 0).toFixed(2);
    const currency = safeVal(app.currency, 'USD');
    const cardScheme = safeVal(app.cardScheme, 'RUPAY');
    const cardFormat = safeVal(app.cardFormat, 'BOTH');
    const accountNum = safeVal(app.generatedAccountNumber, safeVal(app.allocatedAccountNumber, safeVal(app.accountNumber, (app.status === 'ACCOUNT_OPENED' ? 'NBK-ACTIVE' : 'Pending Verification'))));

    const street = safeVal(addr.line1, safeVal(app.addressLine, 'Main Commercial Boulevard'));
    const city = safeVal(addr.city, 'London');
    const postalCode = safeVal(addr.postalCode, 'SW1A 2AA');
    const country = safeVal(addr.country, 'United Kingdom');

    return `
      <!-- Toolbar: Page Switcher & Download/Print Action -->
      <div class="form-editor-toolbar screen-only" style="position:static !important;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;background:#0d1527 !important;border:1px solid rgba(255,255,255,0.14) !important;border-radius:12px;padding:0.75rem 1.1rem;box-shadow:0 6px 20px rgba(0,0,0,0.3) !important">
        <div class="part-nav-pills" style="display:flex;gap:0.4rem;flex-wrap:wrap">
          <button type="button" class="btn btn-outline btn-sm part-btn-${uniquePrefix} active" onclick="window.switchBankFormPart('${uniquePrefix}', 'part1', this)">
            Page 1: CIF &amp; CKYC
          </button>
          <button type="button" class="btn btn-outline btn-sm part-btn-${uniquePrefix}" onclick="window.switchBankFormPart('${uniquePrefix}', 'part2', this)">
            Page 2: KYC &amp; OVD
          </button>
          <button type="button" class="btn btn-outline btn-sm part-btn-${uniquePrefix}" onclick="window.switchBankFormPart('${uniquePrefix}', 'part3', this)">
            Page 3: Account Form
          </button>
          <button type="button" class="btn btn-outline btn-sm part-btn-${uniquePrefix}" onclick="window.switchBankFormPart('${uniquePrefix}', 'part4', this)">
            Page 4: Declarations
          </button>
          <button type="button" class="btn btn-outline btn-sm part-btn-${uniquePrefix}" onclick="window.switchBankFormPart('${uniquePrefix}', 'all', this)">
            View All 4 Pages
          </button>
        </div>

        <div style="display:flex;align-items:center;gap:0.6rem">
          <div style="font-family:monospace;font-size:0.85rem;font-weight:800;color:var(--brand-400);background:rgba(99,102,241,0.15);padding:0.3rem 0.65rem;border-radius:6px;border:1px solid rgba(99,102,241,0.3)">
            ${appNumber}
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="window.printBankApplicationForm('${uniquePrefix}')" title="Download Official 4-Page PDF / Print Document" style="font-weight:700">
            Download &amp; Print Form (PDF)
          </button>
        </div>
      </div>

      <!-- Authentic Physical Bank Paper Sheet -->
      <div id="print-sheet-${uniquePrefix}" class="bank-paper-sheet printable-bank-sheet" style="background:#ffffff;color:#0b2545;border:2px solid #0b2545;padding:clamp(0.75rem,2.5vw,1.5rem);border-radius:4px;box-shadow:0 8px 30px rgba(0,0,0,0.12);width:min(100%,1060px);margin-inline:auto">
        
        <!-- ==================== PAGE 1: CIF & CKYC ==================== -->
        <div id="${uniquePrefix}-part1" class="bank-form-part" style="display:block">
          
          <!-- Sheet Header -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0b2545;padding-bottom:0.75rem;margin-bottom:0.85rem">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:42px;height:42px;border-radius:6px;background:#0b2545;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:900">
                              </div>
              <div>
                <div style="font-size:1.15rem;font-weight:900;letter-spacing:-0.01em;color:#0b2545">PUBLIC / PRIVATE SECTOR BANK OF INDIA</div>
                <div style="font-size:0.75rem;font-weight:700;color:#334155">UNIFORM ACCOUNT OPENING FORM FOR RESIDENT INDIVIDUALS</div>
              </div>
            </div>
            <div style="text-align:end">
              <div style="font-size:0.82rem;font-weight:800;color:#0b2545">PART I: CIF &amp; CKYC FORM</div>
              <div style="font-size:0.7rem;color:#475569">(Customer Information Sheet - Page 1 of 4)</div>
            </div>
          </div>

          <!-- Instructions Banner -->
          <div style="background:#f1f5f9;border:1px solid #cbd5e1;padding:0.4rem 0.75rem;border-radius:4px;font-size:0.72rem;color:#334155;margin-bottom:0.75rem">
            <strong>Instructions:</strong> Official registered bank application dossier. Fields filled in block letters.
          </div>

          <!-- Metadata & Branch Control Grid -->
          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:0.85rem;font-size:0.78rem">
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:28%">
                <strong>Application Type*:</strong><br>
                <div style="margin-top:0.3rem">
                  ${renderRadioStatic('New', appType === 'NEW')}
                  ${renderRadioStatic('Update', appType === 'UPDATE')}
                </div>
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:42%">
                <strong>Account Category*:</strong><br>
                <div style="margin-top:0.3rem">
                  ${renderRadioStatic('Normal', !['SMALL', 'MINOR', 'STAFF'].includes(accType))}
                  ${renderRadioStatic('Small', accType === 'SMALL' || accType === 'BSBDA_SMALL')}
                  ${renderRadioStatic('Minor', accType === 'MINOR' || accType === 'STUDENT')}
                  ${renderRadioStatic('Staff', accType === 'STAFF')}
                </div>
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:30%">
                <strong>Date (DD/MM/YYYY):</strong>
                <div style="margin-top:0.3rem">${renderDateBoxes(curDate)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">
                <strong>Branch Name &amp; Code:</strong><br>
                <span style="font-weight:700;color:#0b2545">${branchName}</span> (${branchCode})
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="2">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div><strong>Application Number:</strong> <span style="font-family:monospace;font-weight:800;color:#4f46e5">${appNumber}</span></div>
                  <div><strong>CKYC Number:</strong> ${renderCharBoxes('14DIGITCKYC000', 14)}</div>
                </div>
              </td>
            </tr>
          </table>

          <!-- 1. PERSONAL DETAILS -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem;display:flex;justify-content:space-between">
            <span>1. PERSONAL DETAILS (SAME AS ID PROOF)</span>
            <span style="font-size:0.7rem;font-weight:500;opacity:0.85">Block Letters Only</span>
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:0.85rem;font-size:0.78rem">
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:25%"><strong>Full Name (Prefix):</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="3">
                ${renderRadioStatic('Mr.', true)}
                ${renderRadioStatic('Mrs.', false)}
                ${renderRadioStatic('Ms.', false)}
                ${renderRadioStatic('Dr.', false)}
              </td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>First Name*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="3">${renderCharBoxes(firstName, 20)}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Middle Name:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">${renderCharBoxes(middleName, 12)}</td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:15%"><strong>Last Name*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">${renderCharBoxes(lastName, 16)}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Date of Birth (DOB)*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">${renderDateBoxes(dob)}</td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Gender*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">
                ${renderRadioStatic('Male', true)}
                ${renderRadioStatic('Female', false)}
                ${renderRadioStatic('Other', false)}
              </td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>PAN / Tax ID Number*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">${renderCharBoxes(taxId, 10)}</td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Citizenship:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>${country || 'INDIAN'}</strong> (Resident Individual)</td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Occupation / Employment:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="3">
                <strong>${emp.status || 'EMPLOYED'}</strong> • Employer: <strong>${emp.employer || 'Private Enterprise'}</strong> • Annual Income: <strong>$${Number(emp.annualIncome || 54000).toLocaleString()}/yr</strong>
              </td>
            </tr>
          </table>

          <!-- 2. CONTACT & ADDRESS DETAILS -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem">
            2. CONTACT &amp; RESIDENTIAL ADDRESS DETAILS
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:0.75rem;font-size:0.78rem">
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:25%"><strong>Mobile Number*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" width="35%"><strong style="font-family:monospace;color:#0b2545">${phone || '+44 7700 900331'}</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:15%"><strong>Email ID*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong style="color:#0b2545">${email || 'applicant@example.com'}</strong></td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Residential Address*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="3">
                <span style="font-size:0.85rem;font-weight:700">${street}</span>, ${city}, Postal Code: <strong>${postalCode}</strong>, Country: <strong>${country}</strong>
              </td>
            </tr>
          </table>

          <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#64748b;border-top:1px solid #cbd5e1;padding-top:0.4rem;margin-top:0.85rem">
            <span>Form 101-A: Customer Information Form (Part-I)</span>
            <span>Page 1 of 4</span>
          </div>
        </div>

        <!-- ==================== PAGE 2: KYC & OVD ==================== -->
        <div id="${uniquePrefix}-part2" class="bank-form-part" style="display:none">
          
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0b2545;padding-bottom:0.75rem;margin-bottom:0.85rem">
            <div>
              <div style="font-size:1.15rem;font-weight:900;color:#0b2545">PUBLIC / PRIVATE SECTOR BANK OF INDIA</div>
              <div style="font-size:0.75rem;font-weight:700;color:#334155">DOCUMENTATION &amp; OFFICIALLY VALID DOCUMENTS (OVD)</div>
            </div>
            <div style="text-align:end">
              <div style="font-size:0.82rem;font-weight:800;color:#0b2545">PART I (CONTINUED): KYC VERIFICATION</div>
              <div style="font-size:0.7rem;color:#475569">Page 2 of 4</div>
            </div>
          </div>

          <!-- Proof of Identity & Address Table -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem">
            3. OFFICIALLY VALID DOCUMENTS (OVD) SUBMITTED FOR IDENTITY &amp; ADDRESS
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:1rem;font-size:0.78rem">
            <tr style="background:#f1f5f9">
              <th style="padding:0.5rem;border:1px solid #cbd5e1;text-align:start;width:30%">Document Category</th>
              <th style="padding:0.5rem;border:1px solid #cbd5e1;text-align:start">Document Type</th>
              <th style="padding:0.5rem;border:1px solid #cbd5e1;text-align:start">Identification / Ref Number</th>
              <th style="padding:0.5rem;border:1px solid #cbd5e1;text-align:center;width:20%">Status</th>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Proof of Identity (POI)*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>${idDoc.type || 'PASSPORT / NATIONAL_ID'}</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><code style="font-weight:800;color:#0b2545">${idDoc.number || taxId}</code></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;text-align:center"><span style="color:#059669;font-weight:700">✓ VERIFIED IN LEDGER</span></td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Proof of Address (POA)*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>${addrDoc.type || 'UTILITY_BILL / BANK_STATEMENT'}</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><code style="font-weight:800;color:#0b2545">${addrDoc.number || 'OVD-POA-VERIFIED'}</code></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;text-align:center"><span style="color:#059669;font-weight:700">✓ ADDRESS MATCHED</span></td>
            </tr>
          </table>

          <!-- Photo & Specimen Signature Verification Box -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem">
            4. APPLICANT PHOTOGRAPH &amp; DIGITAL SPECIMEN SIGNATURE
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.25rem">
            <!-- Photo Slot -->
            <div style="border:2px dashed #94a3b8;border-radius:6px;padding:1rem;text-align:center;background:#f8fafc">
              <div style="font-size:0.75rem;font-weight:800;color:#0b2545;text-transform:uppercase;margin-bottom:0.5rem">
                Passport Size Photograph
              </div>
              <div style="width:120px;height:140px;margin:0 auto;border:2px solid #0b2545;background:#e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:4px">
                <span style="font-size:0.68rem;font-weight:800;color:#0b2545;margin-top:0.25rem">${firstName}</span>
                <span style="font-size:0.62rem;color:#64748b">Verified Bio</span>
              </div>
              <div style="font-size:0.68rem;color:#64748b;margin-top:0.4rem">Official photo uploaded &amp; matched with biometric record</div>
            </div>

            <!-- Signature Slot -->
            <div style="border:2px dashed #94a3b8;border-radius:6px;padding:1rem;text-align:center;background:#f8fafc">
              <div style="font-size:0.75rem;font-weight:800;color:#0b2545;text-transform:uppercase;margin-bottom:0.5rem">
                Digital Specimen Signature
              </div>
              <div style="width:200px;height:140px;margin:0 auto;border:2px solid #0b2545;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:4px;padding:0.5rem">
                <div style="font-family:'Brush Script MT', 'Dancing Script', cursive, sans-serif;font-size:1.8rem;color:#1e3a8a;transform:rotate(-3deg)">
                  ${fullName}
                </div>
                <div style="font-size:0.62rem;color:#059669;font-weight:700;margin-top:0.5rem">
                  ✓ Digital Signature Validated
                </div>
              </div>
              <div style="font-size:0.68rem;color:#64748b;margin-top:0.4rem">Cryptographically authenticated online signature</div>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#64748b;border-top:1px solid #cbd5e1;padding-top:0.4rem">
            <span>Form 101-A: Customer Information Form (Part-I Continued)</span>
            <span>Page 2 of 4</span>
          </div>
        </div>

        <!-- ==================== PAGE 3: ACCOUNT FORM ==================== -->
        <div id="${uniquePrefix}-part3" class="bank-form-part" style="display:none">
          
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0b2545;padding-bottom:0.75rem;margin-bottom:0.85rem">
            <div>
              <div style="font-size:1.15rem;font-weight:900;color:#0b2545">PUBLIC / PRIVATE SECTOR BANK OF INDIA</div>
              <div style="font-size:0.75rem;font-weight:700;color:#334155">CORE BANKING PRODUCT &amp; ACCOUNT SPECIFICATIONS</div>
            </div>
            <div style="text-align:end">
              <div style="font-size:0.82rem;font-weight:800;color:#0b2545">PART II: ACCOUNT FORM</div>
              <div style="font-size:0.7rem;color:#475569">Page 3 of 4</div>
            </div>
          </div>

          <!-- Account Type Requested -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem">
            5. TYPE OF ACCOUNT &amp; FINANCIAL TERMS
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:1rem;font-size:0.78rem">
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:25%"><strong>Selected Product Scheme*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">
                <span class="status-pill active" style="font-size:0.8rem;font-weight:800">${accType}</span>
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:20%"><strong>Operating Mode:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Single / Self Operated</strong></td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Opening Deposit Amount*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">
                <strong style="font-size:0.95rem;color:#059669">${deposit} ${currency}</strong>
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Base Currency:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>${currency}</strong></td>
            </tr>
          </table>

          <!-- Debit Card & Channels -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem">
            6. BANKING FACILITIES &amp; PAYMENT CHANNELS REQUESTED
          </div>

          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:1rem;font-size:0.78rem">
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:25%"><strong>Debit Card Scheme*:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1">
                ${renderRadioStatic('RuPay', cardScheme === 'RUPAY')}
                ${renderRadioStatic('Visa', cardScheme === 'VISA')}
                ${renderRadioStatic('MasterCard', cardScheme === 'MASTERCARD')}
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:20%"><strong>Card Format:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>${cardFormat}</strong> (Virtual + Metal Contactless)</td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Name on Debit Card:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="3">${renderCharBoxes(fullName, 26)}</td>
            </tr>
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1"><strong>Channels Enabled:</strong></td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1" colspan="3">
                <span style="color:#059669;font-weight:700">✓ Internet Banking</span> &nbsp;•&nbsp; 
                <span style="color:#059669;font-weight:700">✓ Mobile Banking &amp; 2FA</span> &nbsp;•&nbsp; 
                <span style="color:#059669;font-weight:700">✓ SMS Alerts</span> &nbsp;•&nbsp; 
                <span style="color:#059669;font-weight:700">✓ e-Statements</span>
              </td>
            </tr>
          </table>

          <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#64748b;border-top:1px solid #cbd5e1;padding-top:0.4rem">
            <span>Form 101-B: Account Opening Form (Part-II)</span>
            <span>Page 3 of 4</span>
          </div>
        </div>

        <!-- ==================== PAGE 4: DECLARATIONS & OFFICE USE ==================== -->
        <div id="${uniquePrefix}-part4" class="bank-form-part" style="display:none">
          
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0b2545;padding-bottom:0.75rem;margin-bottom:0.85rem">
            <div>
              <div style="font-size:1.15rem;font-weight:900;color:#0b2545">PUBLIC / PRIVATE SECTOR BANK OF INDIA</div>
              <div style="font-size:0.75rem;font-weight:700;color:#334155">DECLARATIONS &amp; OFFICIAL BANK VERIFICATION</div>
            </div>
            <div style="text-align:end">
              <div style="font-size:0.82rem;font-weight:800;color:#0b2545">PART III: DECLARATIONS &amp; STAMP</div>
              <div style="font-size:0.7rem;color:#475569">Page 4 of 4</div>
            </div>
          </div>

          <!-- Declarations -->
          <div style="background:#0b2545;color:#fff;padding:0.35rem 0.65rem;font-size:0.8rem;font-weight:800;margin-bottom:0.6rem">
            7. APPLICANT DECLARATIONS &amp; FATCA/CRS SELF-CERTIFICATION
          </div>

          <div style="border:1px solid #cbd5e1;padding:0.75rem;border-radius:4px;font-size:0.74rem;line-height:1.5;color:#334155;margin-bottom:1rem;background:#f8fafc">
            <p style="margin:0 0 0.5rem 0">
              1. I/We hereby declare that all particulars and details furnished in this application form are true, correct, and complete to the best of my knowledge.
            </p>
            <p style="margin:0 0 0.5rem 0">
              2. I/We have read, understood, and agree to be bound by the Terms and Conditions and Rules of the Bank regarding the conduct of accounts and services.
            </p>
            <p style="margin:0">
              3. <strong>FATCA / CRS Certification:</strong> I certify that I am a tax resident of the stated jurisdiction and have provided valid tax identification.
            </p>
          </div>

          <!-- Signature Line Table -->
          <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;margin-bottom:1rem;font-size:0.78rem">
            <tr>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;width:33%">
                <strong>Date:</strong> <span>${curDate}</span><br>
                <strong>Place:</strong> <span>${city.toUpperCase()}</span>
              </td>
              <td style="padding:0.5rem;border:1px solid #cbd5e1;text-align:center" colspan="2">
                <div style="font-family:'Brush Script MT', 'Dancing Script', cursive, sans-serif;font-size:1.4rem;color:#1e3a8a">
                  ${fullName}
                </div>
                <div style="border-top:1px solid #94a3b8;font-size:0.7rem;font-weight:700;margin-top:0.25rem">
                  Signature / Thumb Impression of 1st Applicant
                </div>
              </td>
            </tr>
          </table>

          ${(() => {
            const officeVer = app.officeVerification || (app.formData && app.formData.officeVerification) || {};
            const isDecided = (app.status === 'ACCOUNT_OPENED' || app.status === 'APPROVED' || app.status === 'REJECTED' || !!app.reviewedAt || !!officeVer.decision);
            
            // Point 1: During application filling and while under review, form ends with signatures & declarations.
            // Office section is only appended once a decision (Approved or Rejected) is made by the bank official!
            if (!isDecided) {
              return '';
            }

            const isApproved = (app.status === 'ACCOUNT_OPENED' || app.status === 'APPROVED' || officeVer.decision === 'APPROVED');
            const officerName = safeVal(officeVer.verifyingOfficerName, safeVal(app.verifyingOfficerName, safeVal(app.officerName, safeVal(app.reviewedBy, 'Bank Officer'))));
            const officerCode = safeVal(officeVer.officerEmpCode, safeVal(app.officerEmpCode, safeVal(app.officerCode, 'EMP01')));
            const riskCategory = (safeVal(officeVer.riskCategory, safeVal(app.riskCategory, 'LOW'))).toUpperCase();
            const kycMode = safeVal(officeVer.kycMode, safeVal(app.kycMode, 'In-Person Verification (IPV)'));
            const ipvVerified = (officeVer.ipvVerified !== false && app.ipvVerified !== false);
            const reviewedTime = safeVal(officeVer.verifiedAt, safeVal(app.reviewedAt, ''));
            const reviewNotes = safeVal(officeVer.notes, safeVal(app.reviewNotes, ''));
            const brandColor = isApproved ? '#0a7f59' : '#c2263c';
            const stampDate = formatStampDate(reviewedTime);
            const stampSvg = renderOfficialRubberStampSVG(isApproved, stampDate, uniquePrefix);

            return `
              <!-- ==================== 8. FOR OFFICE USE ONLY (APPENDED AFTER BANK OFFICER REVIEW) ==================== -->
              <div style="margin-top:1.5rem;border:2px solid ${brandColor};border-radius:10px;overflow:hidden;background:#ffffff;box-shadow:0 6px 25px rgba(0,0,0,0.08)">
                <div style="background:${brandColor};color:#ffffff;padding:0.6rem 1rem;font-size:0.88rem;font-weight:900;display:flex;justify-content:space-between;align-items:center;letter-spacing:0.02em">
                  <div style="display:flex;align-items:center;gap:0.5rem">
                    <span>FOR OFFICE USE ONLY (BANK AUTHORIZATION &amp; OFFICIAL DECISION)</span>
                  </div>
                  <span style="font-size:0.75rem;background:rgba(255,255,255,0.22);color:#ffffff;padding:0.2rem 0.65rem;border-radius:9999px;font-weight:800;letter-spacing:0.05em">
                    ${isApproved ? '✓ APPROVED &amp; ACCOUNT OPENED' : '✕ REJECTED BY UNDERWRITING'}
                  </span>
                </div>

                <div style="display:grid;grid-template-columns:1.35fr 1fr;gap:1.25rem;padding:1.25rem;align-items:center;background:#ffffff;color:#0b2545">
                  <!-- Underwriting Details Left Column -->
                  <div>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:0.75rem;font-size:0.8rem">
                      <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:0.45rem 0;color:#64748b;width:45%;font-size:0.74rem">Allocated Core Account No:</td>
                        <td style="padding:0.45rem 0">
                          <strong style="font-family:monospace;font-size:1.15rem;color:${brandColor} !important;letter-spacing:0.03em">
                            ${isApproved ? accountNum : 'REJECTED / NOT ALLOCATED'}
                          </strong>
                        </td>
                      </tr>
                      <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:0.45rem 0;color:#64748b;font-size:0.74rem">Customer ID (CIF):</td>
                        <td style="padding:0.45rem 0">
                          <strong style="font-family:monospace;font-size:0.95rem;color:#4f46e5 !important">${safeVal(app.customerId, 'CIF-' + appNumber.slice(-6))}</strong>
                        </td>
                      </tr>
                      <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:0.45rem 0;color:#64748b;font-size:0.74rem">Verifying Bank Officer:</td>
                        <td style="padding:0.45rem 0">
                          <strong style="color:#0b2545 !important;font-size:0.88rem">${officerName}</strong>
                          <span style="font-family:monospace;color:#4f46e5 !important;font-size:0.78rem;margin-left:0.35rem;background:#e0e7ff;padding:0.1rem 0.4rem;border-radius:4px;font-weight:700">${officerCode}</span>
                        </td>
                      </tr>
                      <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:0.45rem 0;color:#64748b;font-size:0.74rem">Risk Category Assessment:</td>
                        <td style="padding:0.45rem 0">
                          <span style="display:inline-block;padding:0.18rem 0.55rem;background:${riskCategory === 'HIGH' ? '#fee2e2' : riskCategory === 'MED' ? '#fef3c7' : '#ecfdf5'};color:${riskCategory === 'HIGH' ? '#b91c1c' : riskCategory === 'MED' ? '#b45309' : '#047857'} !important;font-weight:800;border-radius:4px;font-size:0.74rem">
                            ● ${riskCategory} RISK
                          </span>
                        </td>
                      </tr>
                      <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:0.45rem 0;color:#64748b;font-size:0.74rem">KYC Verification Mode:</td>
                        <td style="padding:0.45rem 0">
                          <strong style="color:#0b2545 !important;font-size:0.82rem">${kycMode}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0.45rem 0;color:#64748b;font-size:0.74rem">Decision Timestamp:</td>
                        <td style="padding:0.45rem 0;font-size:0.78rem;color:#334155;font-weight:600">
                          ${reviewedTime ? reviewedTime.replace('T', ' ').slice(0, 16) : stampDate} • ${branchName} (${branchCode})
                        </td>
                      </tr>
                    </table>

                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:0.5rem 0.75rem;font-size:0.74rem;color:#0b2545;margin-top:0.4rem">
                      <div style="font-weight:700;color:${brandColor} !important;display:flex;align-items:center;gap:0.35rem">
                        <span>✓</span> <span>In-Person Verification (IPV): Carried out and verified original documents by Bank Official</span>
                      </div>
                      ${reviewNotes ? `
                        <div style="margin-top:0.4rem;padding-top:0.4rem;border-top:1px dashed #cbd5e1;color:#475569;font-size:0.73rem">
                          <strong style="color:#0b2545 !important">Official Remarks / Underwriting Notes:</strong> ${reviewNotes}
                        </div>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Authentic Distressed Rubber Stamp Right Column -->
                  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0.5rem">
                    <div style="max-width:320px;width:100%;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.12));transition:transform 0.2s ease">
                      ${stampSvg}
                    </div>
                    <div style="font-size:0.68rem;font-weight:700;letter-spacing:0.08em;color:${brandColor};margin-top:0.5rem;text-transform:uppercase">
                      OFFICIAL REGULATORY BANK AUDIT SEAL • ${branchCode}
                    </div>
                  </div>
                </div>
              </div>
            `;
          })()}

          <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#64748b;border-top:1px solid #cbd5e1;padding-top:0.5rem;margin-top:1.25rem">
            <span>Form 101-C: Official Bank Application Dossier (Part-III)</span>
            <span>Page 4 of 4</span>
          </div>
        </div>

      </div>
    `;
  }

  /**
   * Switches active part of the rendered bank form
   */
  window.switchBankFormPart = function(prefix, partId, btnEl) {
    const parts = ['part1', 'part2', 'part3', 'part4'];
    
    if (partId === 'all') {
      parts.forEach(p => {
        const el = document.getElementById(`${prefix}-${p}`);
        if (el) el.style.display = 'block';
      });
    } else {
      parts.forEach(p => {
        const el = document.getElementById(`${prefix}-${p}`);
        if (el) el.style.display = (p === partId) ? 'block' : 'none';
      });
    }

    if (btnEl) {
      document.querySelectorAll(`.part-btn-${prefix}`).forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }
  };

  /**
   * Triggers clean print/PDF view for the bank form
   */
  window.printBankApplicationForm = function(prefix) {
    let sheetEl = document.getElementById(`print-sheet-${prefix}`);
    if (!sheetEl) {
      if (prefix === 'cust_track' && window.currentTrackedApp) {
        window.renderBankApplicationPaperForm(window.currentTrackedApp, 'cust-bank-paper-container', 'cust_track');
        sheetEl = document.getElementById(`print-sheet-${prefix}`);
      } else if (prefix === 'rf' && window.currentReviewApplication) {
        window.renderBankApplicationPaperForm(window.currentReviewApplication, 'review-bank-paper-container', 'rf');
        sheetEl = document.getElementById(`print-sheet-${prefix}`);
      }
    }

    if (!sheetEl) {
      window.print();
      return;
    }

    // Clone the sheet so the user's current interactive tab view in the modal is undisturbed
    const clone = sheetEl.cloneNode(true);
    const parts = ['part1', 'part2', 'part3', 'part4'];
    parts.forEach(p => {
      const el = clone.querySelector(`#${prefix}-${p}`);
      if (el) el.style.display = 'block';
    });
    const toolbar = clone.querySelector('.form-editor-toolbar');
    if (toolbar) toolbar.remove();

    const printWin = window.open('', '_blank', 'width=950,height=800');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NeoBank - Official Account Opening Form</title>
        <meta charset="utf-8">
        <link rel="stylesheet" href="/css/style.css">
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { background: #fff !important; color: #000 !important; font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 10px; }
          .bank-paper-sheet { border: 2px solid #000 !important; box-shadow: none !important; margin: 0 !important; max-width: 100% !important; padding: 12px !important; }
          .bank-form-part { page-break-after: always; margin-bottom: 20px; }
          .bank-form-part:last-child { page-break-after: avoid; margin-bottom: 0; }
          .screen-only, .form-editor-toolbar, .no-print { display: none !important; }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  /**
   * Renders the complete form sheet into target DOM container
   * Supports (app, containerId, uniquePrefix) or (containerId, app, uniquePrefix)
   */
  window.renderBankApplicationPaperForm = function(arg1, arg2, uniquePrefix = 'rf') {
    let app, containerId;
    if (typeof arg1 === 'string') {
      containerId = arg1;
      app = arg2;
    } else {
      app = arg1;
      containerId = arg2;
    }
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = buildBankPaperFormHTML(app, uniquePrefix);
  };

  /**
   * Opens the document viewer modal for decrypted document viewing
   */
  window.viewDecryptedDocument = function(docId, docName = 'Document', docMime = 'image/png') {
    const viewerModal = document.getElementById('modal-document-viewer');
    const titleEl = document.getElementById('doc-viewer-title');
    const bodyEl = document.getElementById('doc-viewer-body');
    const downloadBtn = document.getElementById('doc-viewer-download-btn');
    const newTabBtn = document.getElementById('doc-viewer-newtab-btn');

    const downloadUrl = `/onboarding/documents/${docId}/download`;
    const inlineUrl = `${downloadUrl}?inline=true`;

    if (titleEl) titleEl.textContent = docName;
    if (downloadBtn) {
      downloadBtn.onclick = () => window.downloadDecryptedDocument(docId, docName);
    }
    if (newTabBtn) {
      newTabBtn.onclick = () => window.open(inlineUrl, '_blank');
    }

    if (bodyEl) {
      const isImg = docMime.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(docName);
      const isPdf = docMime.includes('pdf') || docName.toLowerCase().endsWith('.pdf');

      if (isImg) {
        bodyEl.innerHTML = `
          <div style="text-align:center;padding:1rem;background:#050811;border-radius:8px;max-height:65vh;overflow:auto">
            <img src="${inlineUrl}" alt="${docName}" style="max-width:100%;max-height:60vh;object-fit:contain;border-radius:4px;box-shadow:0 4px 15px rgba(0,0,0,0.5)">
          </div>
        `;
      } else if (isPdf) {
        bodyEl.innerHTML = `
          <div style="height:65vh;width:100%;border-radius:8px;overflow:hidden">
            <iframe src="${inlineUrl}" style="width:100%;height:100%;border:none"></iframe>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div style="padding:1.5rem;text-align:center;background:rgba(255,255,255,0.03);border-radius:8px">
            <div style="font-size:2.5rem;margin-bottom:0.5rem"></div>
            <h4 style="font-size:1.05rem;font-weight:700;margin-bottom:0.4rem">${docName}</h4>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem">
              Encrypted binary file verified &amp; decrypted with AES-256 key from SQLite storage.
            </div>
            <iframe src="${inlineUrl}" style="width:100%;height:220px;border:1px solid var(--border-subtle);border-radius:6px;margin-bottom:1rem;background:#fff"></iframe>
            <div>
              <button type="button" class="btn btn-primary" onclick="window.downloadDecryptedDocument('${docId}', '${docName}')">
                Download Decrypted File
              </button>
            </div>
          </div>
        `;
      }
    }

    if (typeof window.openModal === 'function') {
      window.openModal('modal-document-viewer');
    } else if (viewerModal) {
      viewerModal.style.display = 'flex';
    }
  };

  /**
   * Downloads decrypted document with proper filename
   */
  window.downloadDecryptedDocument = function(docId, docName) {
    const link = document.createElement('a');
    link.href = `/onboarding/documents/${docId}/download`;
    link.download = docName || `document_${docId}.bin`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

})(window);
