/**
 * Bank Staff / Employee Portal Controller
 * Role-Based Underwriting, Customer Oversight, Dispute Resolution, and Bank Administration
 */

// Universal Human-Readable Formatter Fallback & Safety Guarantee
if (typeof window.formatHumanText !== 'function') {
  window.formatHumanText = function(val) {
    if (!val || typeof val !== 'string') return val || '';
    const trimmed = val.trim();
    if (trimmed.startsWith('http') || trimmed.includes('@') || /^\$?[0-9]/.test(trimmed) || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(trimmed)) {
      return val;
    }
    if (trimmed.includes('_') || (/^[A-Z0-9_]{3,}$/.test(trimmed) && trimmed === trimmed.toUpperCase())) {
      return trimmed
        .split('_')
        .filter(Boolean)
        .map(part => {
          const upper = part.toUpperCase();
          if (['ID', 'KYC', 'OTP', 'APY', 'NRI', 'ATM', 'USD', 'EUR', 'GBP'].includes(upper)) {
            return upper;
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join(' ');
    }
    return val;
  };
}
var formatHumanText = window.formatHumanText;

if (typeof window.showToast !== 'function') {
  window.showToast = function(msg, type) {
    console.log(`[Toast ${type || 'info'}]:`, msg);
  };
}
var showToast = window.showToast;

let allBankUsers = [];
let pendingKycQueue = [];
let pendingLoansQueue = [];
let openDisputesQueue = [];

// Initialize Employee Dashboard
async function loadEmployeeDashboard() {
  try {
    const [stats, usersRes, kycList, loansList, disputesList] = await Promise.all([
      api('/admin/stats'),
      api('/admin/users'),
      api('/admin/kyc/pending'),
      api('/admin/loans/pending'),
      api('/admin/disputes')
    ]);

    allBankUsers = usersRes.data || [];
    pendingKycQueue = kycList || [];
    pendingLoansQueue = loansList || [];
    openDisputesQueue = disputesList || [];

    renderEmployeeMetrics(stats);
    renderCustomerDirectory(allBankUsers);
    renderKycQueue(pendingKycQueue);
    renderLoansQueue(pendingLoansQueue);
    renderDisputesQueue(openDisputesQueue);
  } catch (err) {
    console.error('Failed to load employee dashboard:', err);
  }
}

// ----------------------------------------------------------------- STATS
function renderEmployeeMetrics(stats) {
  const custCountEl = document.getElementById('emp-stat-customers');
  if (custCountEl) custCountEl.textContent = stats.totalCustomers || 0;

  const depositsEl = document.getElementById('emp-stat-deposits');
  if (depositsEl) depositsEl.textContent = `$${Number(stats.totalDepositsUSD || 0).toLocaleString()}`;

  const kycEl = document.getElementById('emp-stat-kyc-pending');
  if (kycEl) kycEl.textContent = stats.pendingKycCount || 0;

  const loansEl = document.getElementById('emp-stat-loans-pending');
  if (loansEl) loansEl.textContent = stats.pendingLoansCount || 0;

  const disputesEl = document.getElementById('emp-stat-disputes');
  if (disputesEl) disputesEl.textContent = stats.openDisputesCount || 0;
}

// ----------------------------------------------------------------- CUSTOMER DIRECTORY
function renderCustomerDirectory(users) {
  const tbody = document.getElementById('emp-customers-table');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-secondary)">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const isSuspended = u.status === 'SUSPENDED';
    const profile = u.profile || {};
    const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || u.email;
    const isStaff = u.role === 'ADMIN' || u.role === 'EMPLOYEE' || u.role === 'SUPER_ADMIN';

    return `
      <tr>
        <td style="font-family:monospace;font-size:0.8rem">${u.id}</td>
        <td>
          <div style="font-weight:700;color:var(--text-main)">${name}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${u.email}</div>
        </td>
        <td><span class="role-badge ${u.role.toLowerCase()}">${formatHumanText(u.role)}</span></td>
        <td><span class="status-pill ${u.status.toLowerCase()}">${formatHumanText(u.status)}</span></td>
        <td style="font-weight:600">$${Number(u.totalBalanceUSD || 0).toLocaleString()} (${u.accountsCount || 0} accts)</td>
        <td>
          ${!isStaff ? `
            <button class="btn btn-outline btn-sm" onclick="toggleUserStatus('${u.id}', ${isSuspended})">
              ${isSuspended ? 'Activate' : 'Suspend'}
            </button>
          ` : '<span style="color:var(--text-muted);font-size:0.75rem">Protected</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

async function toggleUserStatus(userId, isSuspended) {
  try {
    const action = isSuspended ? 'activate' : 'suspend';
    await api(`/admin/users/${userId}/${action}`, { method: 'POST' });
    showToast(`Customer status updated to ${action.toUpperCase()}D.`, 'info');
    await loadEmployeeDashboard();
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- KYC QUEUE
function renderKycQueue(pending) {
  const tbody = document.getElementById('emp-kyc-table');
  if (!tbody) return;

  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">✓ No pending KYC submissions. All caught up!</td></tr>`;
    return;
  }

  tbody.innerHTML = pending.map(k => {
    const emp = k.employment || {};
    const docs = (k.documents || []).map(d => `${formatHumanText(d.type)} (${d.number})`).join(', ');

    return `
      <tr>
        <td style="font-family:monospace;font-size:0.8rem">${k.id}</td>
        <td>
          <div style="font-weight:700;color:var(--text-main)">${k.ownerEmail || k.ownerId}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${formatHumanText(emp.status) || ''} at ${emp.employer || 'N/A'} ($${(emp.annualIncome || 0).toLocaleString()}/yr)</div>
        </td>
        <td style="font-size:0.8rem">${docs || 'None'}</td>
        <td><span class="status-pill submitted">${formatHumanText('SUBMITTED')}</span></td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn btn-success btn-sm" onclick="reviewKyc('${k.id}', 'APPROVED')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="promptRejectKyc('${k.id}')">Reject</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function reviewKyc(kycId, decision, reason = null) {
  try {
    await api(`/admin/kyc/${kycId}/review`, {
      method: 'POST',
      body: { decision, reason }
    });
    showToast(`KYC #${kycId} marked as ${decision}.`, 'success');
    await loadEmployeeDashboard();
  } catch (err) {
    // Handled
  }
}

function promptRejectKyc(kycId) {
  const reason = prompt('Please enter the rejection reason for this KYC application:');
  if (reason) {
    reviewKyc(kycId, 'REJECTED', reason);
  }
}

// ----------------------------------------------------------------- LOANS UNDERWRITING
function renderLoansQueue(pending) {
  const tbody = document.getElementById('emp-loans-table');
  if (!tbody) return;

  if (pending.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">✓ No loan applications pending underwriter decision.</td></tr>`;
    return;
  }

  tbody.innerHTML = pending.map(app => {
    const quote = app.quote || {};
    const emp = app.employment || {};

    return `
      <tr>
        <td style="font-family:monospace;font-size:0.8rem">${app.id}</td>
        <td>
          <div style="font-weight:700;color:var(--text-main)">${app.applicantEmail || app.ownerId}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Income: $${(emp.annualIncome || 0).toLocaleString()} • ${emp.employer || ''}</div>
        </td>
        <td style="font-weight:800;color:var(--text-main)">
          $${(quote.amount || 0).toLocaleString()} <span style="font-size:0.75rem;font-weight:normal;color:var(--text-secondary)">(${quote.termMonths || 0} mos @ ${quote.apr || 0}%)</span>
        </td>
        <td><span class="status-pill under_review">${formatHumanText('UNDER_REVIEW')}</span></td>
        <td>
          <div style="display:flex;gap:0.4rem">
            <button class="btn btn-success btn-sm" onclick="decideLoan('${app.id}', 'APPROVED')">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="promptRejectLoan('${app.id}')">Reject</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function decideLoan(appId, decision, reason = null) {
  try {
    await api(`/admin/loans/applications/${appId}/decision`, {
      method: 'POST',
      body: { decision, reason }
    });
    showToast(`Loan application #${appId} decided: ${decision}.`, 'success');
    await loadEmployeeDashboard();
  } catch (err) {
    // Handled
  }
}

function promptRejectLoan(appId) {
  const reason = prompt('Please specify credit underwriting rejection reason:');
  if (reason) {
    decideLoan(appId, 'REJECTED', reason);
  }
}

// ----------------------------------------------------------------- DISPUTES RESOLUTION
function renderDisputesQueue(disputes) {
  const tbody = document.getElementById('emp-disputes-table');
  if (!tbody) return;

  if (disputes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">✓ No open transaction charge disputes.</td></tr>`;
    return;
  }

  tbody.innerHTML = disputes.map(d => {
    const isResolved = d.status.startsWith('RESOLVED');
    return `
      <tr>
        <td style="font-family:monospace;font-size:0.8rem">${d.id}</td>
        <td>
          <div style="font-weight:700;color:var(--text-main)">${d.customerEmail || d.ownerId}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Reason: ${formatHumanText(d.reason)} • "${d.description || ''}"</div>
        </td>
        <td style="font-weight:700;color:var(--rose-500)">$${Number(d.amountDisputed).toFixed(2)}</td>
        <td><span class="status-pill ${d.status.toLowerCase()}">${formatHumanText(d.status)}</span></td>
        <td>
          ${!isResolved ? `
            <div style="display:flex;gap:0.4rem">
              <button class="btn btn-success btn-sm" onclick="resolveDispute('${d.id}', 'REFUND')">Grant Refund</button>
              <button class="btn btn-danger btn-sm" onclick="resolveDispute('${d.id}', 'REJECT')">Deny</button>
            </div>
          ` : `<span style="font-size:0.75rem;color:var(--text-muted)">Resolved (${d.resolvedAt ? d.resolvedAt.slice(0,10) : ''})</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

async function resolveDispute(disputeId, outcome) {
  try {
    await api(`/admin/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: { outcome, note: `Resolved by staff as ${outcome}` }
    });
    showToast(`Dispute #${disputeId} marked as ${outcome}.`, 'success');
    await loadEmployeeDashboard();
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- ACCOUNT OPENING APPLICATIONS (DATE-FILTERED)
let currentAppDateFilter = 'all';
let currentAppStatusFilter = 'all';
let allStaffApplicationsList = [];
let staffAppSearchQuery = '';
let activeReviewAppNumber = null;
let pendingConfirmedAction = null;

// Universal Confirmation Action Modal Controller (Item 8)
function promptActionConfirm({ title, message, icon = '⚠️', showInput = false, inputLabel = 'Notes / Reason:', onConfirm }) {
  const modal = document.getElementById('modal-confirm-action');
  if (!modal) {
    if (confirm(message)) {
      if (onConfirm) onConfirm();
    }
    return;
  }

  document.getElementById('confirm-modal-title').textContent = title || 'Confirm Action';
  document.getElementById('confirm-modal-message').textContent = message || 'Are you sure you want to proceed?';
  document.getElementById('confirm-modal-icon').textContent = icon;

  const inputWrap = document.getElementById('confirm-modal-input-wrap');
  const inputEl = document.getElementById('confirm-modal-input');
  if (showInput) {
    inputWrap.style.display = 'block';
    document.getElementById('confirm-modal-input-label').textContent = inputLabel;
    inputEl.value = '';
    inputEl.focus();
  } else {
    inputWrap.style.display = 'none';
  }

  pendingConfirmedAction = () => {
    const val = showInput ? inputEl.value.trim() : null;
    closeModal('modal-confirm-action');
    if (onConfirm) onConfirm(val);
  };

  openModal('modal-confirm-action');
}

function executeConfirmedAction() {
  if (typeof pendingConfirmedAction === 'function') {
    pendingConfirmedAction();
    pendingConfirmedAction = null;
  }
}

async function loadStaffApplications() {
  try {
    let url = `/onboarding/applications?dateRange=${currentAppDateFilter}&status=${currentAppStatusFilter}`;
    const startInput = document.getElementById('emp-apps-start-date');
    const endInput = document.getElementById('emp-apps-end-date');
    if (startInput && startInput.value) url += `&startDate=${startInput.value}`;
    if (endInput && endInput.value) url += `&endDate=${endInput.value}`;

    const res = await api(url);
    allStaffApplicationsList = res.data || [];
    const metrics = res.metrics || {};

    const todayEl = document.getElementById('emp-stat-apps-today');
    if (todayEl) todayEl.textContent = metrics.receivedToday || 0;
    const pendingEl = document.getElementById('emp-stat-apps-pending');
    if (pendingEl) pendingEl.textContent = metrics.pendingReview || 0;
    const approvedEl = document.getElementById('emp-stat-apps-approved');
    if (approvedEl) approvedEl.textContent = metrics.approved || 0;

    applyStaffAppFilters();
  } catch (err) {
    console.error('Failed to load applications for staff:', err);
  }
}

// Universal Search Filter (Items 10 & 13)
function handleAppTableSearch(query) {
  staffAppSearchQuery = (query || '').toLowerCase().trim();
  applyStaffAppFilters();
}

function applyStaffAppFilters() {
  if (!staffAppSearchQuery) {
    renderStaffApplicationsTable(allStaffApplicationsList);
    return;
  }

  const filtered = allStaffApplicationsList.filter(app => {
    const applicant = app.applicant || {};
    const emp = app.employment || {};
    const q = staffAppSearchQuery;

    const matchRef = (app.applicationNumber || '').toLowerCase().includes(q);
    const matchName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.toLowerCase().includes(q);
    const matchEmail = (applicant.email || '').toLowerCase().includes(q);
    const matchPhone = (applicant.phone || '').toLowerCase().includes(q);
    const matchTax = (app.taxId || '').toLowerCase().includes(q);
    const matchType = (app.accountType || '').toLowerCase().includes(q);
    const matchAppType = (app.applicationType || '').toLowerCase().includes(q);
    const matchStatus = (app.status || '').toLowerCase().includes(q);
    const matchAcc = (app.generatedAccountNumber || '').toLowerCase().includes(q);
    const matchEmp = (emp.employer || '').toLowerCase().includes(q);

    return matchRef || matchName || matchEmail || matchPhone || matchTax || matchType || matchAppType || matchStatus || matchAcc || matchEmp;
  });

  renderStaffApplicationsTable(filtered);
}

function setAppDateFilter(filterType) {
  currentAppDateFilter = filterType;
  
  // Highlight active button
  document.querySelectorAll('.app-date-filter-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-filter-${filterType}`);
  if (activeBtn) activeBtn.classList.add('active');

  loadStaffApplications();
}

function setAppStatusFilter(statusVal) {
  currentAppStatusFilter = statusVal;
  loadStaffApplications();
}

function renderStaffApplicationsTable(apps) {
  const tbody = document.getElementById('emp-applications-table-body');
  if (!tbody) return;

  if (apps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2.5rem;color:var(--text-secondary)">No account applications found matching your criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const applicant = app.applicant || {};
    const emp = app.employment || {};
    const isCompleted = app.status === 'ACCOUNT_OPENED' || app.status === 'REJECTED';

    return `
      <tr style="cursor:pointer;transition:background 0.15s ease" onclick="openApplicationReviewModal('${app.applicationNumber}')" title="Click row to inspect complete application form and documents">
        <td style="font-family:monospace;font-weight:700;color:var(--brand-400)">
          <span>📋 ${app.applicationNumber}</span>
          ${app.applicationType === 'UPDATE' ? '<span style="display:inline-block;font-size:0.65rem;background:rgba(99,102,241,0.2);color:#818cf8;padding:1px 4px;border-radius:4px;margin-left:4px">UPDATE</span>' : ''}
        </td>
        <td>
          <div style="font-weight:700;color:var(--text-main)">${applicant.firstName || ''} ${applicant.lastName || ''}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">${applicant.email || ''} • ${applicant.phone || ''}</div>
          <div style="font-size:0.7rem;color:var(--text-muted)">Tax ID: ${app.taxId || 'N/A'} • ${formatHumanText(emp.status) || ''}</div>
        </td>
        <td><span class="status-pill active">${formatHumanText(app.accountType)}</span></td>
        <td style="font-size:0.8rem;color:var(--text-secondary)">
          ${app.createdAt ? app.createdAt.slice(0, 16).replace('T', ' ') : ''}
        </td>
        <td style="font-weight:700;color:var(--text-main)">$${Number(app.initialDeposit || 0).toFixed(2)}</td>
        <td><span class="status-pill ${app.status.toLowerCase()}">${formatHumanText(app.status)}</span></td>
        <td onclick="event.stopPropagation()">
          ${!isCompleted ? `
            <div style="display:flex;gap:0.4rem">
              <button class="btn btn-success btn-sm" onclick="confirmApproveApplication('${app.applicationNumber}')">
                Approve &amp; Open
              </button>
              <button class="btn btn-danger btn-sm" onclick="confirmRejectApplication('${app.applicationNumber}')">
                Reject
              </button>
            </div>
          ` : app.status === 'ACCOUNT_OPENED' ? `
            <div style="font-size:0.75rem;color:var(--emerald-400);font-weight:600">
              ✓ Acct: ${app.generatedAccountNumber || 'Open'}
            </div>
          ` : `
            <div style="display:flex;align-items:center;gap:0.4rem">
              <span style="font-size:0.75rem;color:var(--rose-500)">✕ Rejected</span>
              <button class="btn btn-outline btn-sm" style="font-size:0.7rem;padding:0.15rem 0.4rem" onclick="promptRevertStatus('${app.applicationNumber}', 'UNDER_REVIEW')" title="Reopen application">↩️ Reopen</button>
            </div>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// ----------------------------------------------------------------- APPLICATION REVIEW MODAL & DOCUMENT DOSSIER
let currentReviewApplication = null;

function switchReviewModalTab(tabKey) {
  const tabs = ['form', 'docs', 'office', 'dossier'];
  tabs.forEach(t => {
    const btn = document.getElementById(`review-tab-btn-${t}`);
    const content = document.getElementById(`review-tab-content-${t}`);
    if (btn) {
      if (t === tabKey) {
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
      }
    }
    if (content) {
      content.style.display = (t === tabKey) ? 'block' : 'none';
    }
  });
}
window.switchReviewModalTab = switchReviewModalTab;

async function openApplicationReviewModal(appNumber) {
  try {
    activeReviewAppNumber = appNumber;
    // GET auto-advances SUBMITTED -> UNDER_REVIEW on first staff view (Item 14)
    const app = await api(`/onboarding/applications/${appNumber}`);
    if (!app) return;
    currentReviewApplication = app;

    // Header info
    document.getElementById('review-modal-app-num').textContent = app.applicationNumber;
    const statusBadge = document.getElementById('review-modal-status-badge');
    statusBadge.textContent = formatHumanText(app.status);
    statusBadge.className = `status-pill ${app.status.toLowerCase()}`;

    const applicant = app.applicant || {};
    const emp = app.employment || {};
    const addr = (applicant.address) || {};
    document.getElementById('review-modal-applicant-name').textContent = 
      `${applicant.firstName || ''} ${applicant.lastName || ''} • ${applicant.email || app.email || ''} • ${applicant.phone || ''}`;

    // 1. Render Authentic 4-Page Uniform Bank Form Sheet into Tab 1
    if (typeof window.renderBankApplicationPaperForm === 'function') {
      window.renderBankApplicationPaperForm(app, 'review-bank-paper-container', 'rf');
    }

    // 2. Render Dedicated Uploaded Documents & ID Vault into Tab 2
    renderReviewDocumentsVault(app);

    // 3. Render Office Verification & Remarks into Tab 3
    const accNum = app.generatedAccountNumber || app.allocatedAccountNumber || app.accountNumber || (app.status === 'ACCOUNT_OPENED' ? 'NBK-ACTIVE' : 'Pending Verification');
    const officeAccEl = document.getElementById('review-modal-office-acc');
    if (officeAccEl) {
      officeAccEl.textContent = accNum;
    }
    const officerNameEl = document.getElementById('review-modal-officer-name');
    if (officerNameEl) officerNameEl.textContent = app.officerName || 'Alexander Sterling';
    const officerCodeEl = document.getElementById('review-modal-officer-code');
    if (officerCodeEl) officerCodeEl.textContent = app.officerCode || 'EMP01';

    renderReviewOfficerMessages(app.officerMessages || []);

    // 4. Render Quick Summary Dossier Grid into Tab 4
    const dossierGrid = document.getElementById('review-modal-dossier-grid');
    if (dossierGrid) {
      dossierGrid.innerHTML = `
        <div><span style="color:var(--text-muted)">Application Type:</span> <strong>${app.applicationType || 'NEW'}</strong></div>
        <div><span style="color:var(--text-muted)">Account Scheme:</span> <strong>${formatHumanText(app.accountType)}</strong></div>
        ${app.linkedAccountNumber ? `<div><span style="color:var(--text-muted)">Linked Account:</span> <strong style="font-family:monospace;color:var(--brand-400)">${app.linkedAccountNumber}</strong></div>` : ''}
        <div><span style="color:var(--text-muted)">Branch:</span> <strong>${app.branchName || 'Central Digital Branch'} (${app.branchCode || 'NBK-001'})</strong></div>
        <div><span style="color:var(--text-muted)">Initial Deposit:</span> <strong>$${Number(app.initialDeposit || 0).toFixed(2)} ${app.currency || 'USD'}</strong></div>
        <div><span style="color:var(--text-muted)">Tax ID (PAN/SSN):</span> <strong style="font-family:monospace">${app.taxId || 'N/A'}</strong></div>
        <div><span style="color:var(--text-muted)">Date of Birth:</span> <strong>${applicant.dob || 'N/A'}</strong></div>
        <div><span style="color:var(--text-muted)">Employment:</span> <strong>${formatHumanText(emp.status || 'EMPLOYED')} at ${emp.employer || 'Private Sector'}</strong></div>
        <div><span style="color:var(--text-muted)">Annual Income:</span> <strong>$${Number(emp.annualIncome || 0).toLocaleString()}/yr</strong></div>
        <div><span style="color:var(--text-muted)">Residential Address:</span> <strong>${addr.line1 || app.addressLine || 'N/A'}, ${addr.city || ''} ${addr.postalCode || ''}</strong></div>
        <div><span style="color:var(--text-muted)">Debit Card Network:</span> <strong style="color:var(--brand-400)">${app.cardScheme || 'RUPAY'}</strong></div>
        <div><span style="color:var(--text-muted)">Card Delivery Format:</span> <strong>${app.cardFormat || 'BOTH (Virtual + Metal)'}</strong></div>
      `;
    }

    // Action Buttons Footer (Guaranteed No #undefined!)
    const actionBtnsContainer = document.getElementById('review-modal-action-buttons');
    if (app.status === 'ACCOUNT_OPENED') {
      actionBtnsContainer.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="color:var(--emerald-400);font-weight:700;font-size:0.85rem">✓ Account Opened #${accNum}</span>
        </div>
      `;
    } else if (app.status === 'REJECTED') {
      actionBtnsContainer.innerHTML = `
        <div style="display:flex;align-items:center;gap:0.5rem">
          <span style="color:var(--rose-500);font-size:0.85rem;font-weight:700;margin-right:0.5rem">✕ Rejected</span>
          <button type="button" class="btn btn-warning btn-sm" onclick="promptRevertStatus('${app.applicationNumber}', 'UNDER_REVIEW')">
            ↩️ Reopen as Under Review
          </button>
          <button type="button" class="btn btn-outline btn-sm" onclick="promptRevertStatus('${app.applicationNumber}', 'SUBMITTED')">
            ↩️ Reopen as Submitted
          </button>
        </div>
      `;
    } else {
      actionBtnsContainer.innerHTML = `
        <div style="display:flex;gap:0.5rem">
          <button type="button" class="btn btn-danger btn-sm" onclick="confirmRejectApplication('${app.applicationNumber}')">
            ✕ Reject Application
          </button>
          <button type="button" class="btn btn-success btn-sm" onclick="confirmApproveApplication('${app.applicationNumber}')" style="font-weight:700">
            ✓ Approve &amp; Open Account
          </button>
        </div>
      `;
    }

    // Default to displaying Tab 1 (Official Form)
    switchReviewModalTab('form');

    openModal('modal-application-review');
    // Refresh background table to reflect status change
    await loadStaffApplications();
  } catch (err) {
    showToast(err.message || 'Error opening application review dossier', 'error');
  }
}

function renderReviewDocumentsVault(app) {
  const docsContainer = document.getElementById('review-modal-docs-list');
  const countBadge = document.getElementById('review-docs-count-badge');
  if (!docsContainer) return;

  const docs = app.documents || [];
  if (countBadge) countBadge.textContent = docs.length;

  if (docs.length === 0) {
    // Show verified form documentation dossier card
    const idDoc = app.identityDocument || {};
    const addrDoc = app.addressProof || {};
    docsContainer.innerHTML = `
      <div style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.25);border-radius:8px;padding:1rem;margin-bottom:0.75rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">
          <strong style="font-size:0.85rem;color:var(--brand-400);display:flex;align-items:center;gap:0.4rem">
            <span>🛡️</span> <span>Verified Form Identity Records (OVD Registered)</span>
          </strong>
          <span style="font-size:0.7rem;color:var(--emerald-400);font-weight:700">✓ Legally Binding Self-Declaration</span>
        </div>
        <p style="font-size:0.78rem;color:var(--text-secondary);margin:0 0 0.75rem 0;line-height:1.45">
          No external binary files were attached to this electronic submission. The applicant provided verified document numbers and officially valid documents recorded below:
        </p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;font-size:0.78rem">
          <div style="background:rgba(0,0,0,0.2);padding:0.6rem 0.8rem;border-radius:6px">
            <span style="color:var(--text-muted);display:block;font-size:0.7rem">Proof of Identity (POI):</span>
            <strong style="color:var(--text-main)">${idDoc.type || 'National ID / Tax ID'}</strong>
            <div style="font-family:monospace;color:var(--brand-400);margin-top:0.2rem">${idDoc.number || app.taxId || 'N/A'}</div>
          </div>
          <div style="background:rgba(0,0,0,0.2);padding:0.6rem 0.8rem;border-radius:6px">
            <span style="color:var(--text-muted);display:block;font-size:0.7rem">Proof of Address (POA):</span>
            <strong style="color:var(--text-main)">${addrDoc.type || 'Utility Bill / Council Tax'}</strong>
            <div style="font-family:monospace;color:var(--brand-400);margin-top:0.2rem">${addrDoc.number || 'OVD-ADDR-VERIFIED'}</div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  docsContainer.innerHTML = docs.map(doc => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0.8rem 1rem;background:rgba(255,255,255,0.02);border:1px solid var(--border-subtle);border-radius:8px;flex-wrap:wrap;gap:0.6rem">
      <div style="display:flex;align-items:center;gap:0.75rem">
        <div style="width:38px;height:38px;border-radius:8px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;font-size:1.3rem">
          ${(doc.name || '').endsWith('.pdf') ? '📑' : '🖼️'}
        </div>
        <div>
          <div style="font-weight:700;color:var(--text-main);font-size:0.85rem">${doc.name}</div>
          <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.72rem;color:var(--text-muted);margin-top:0.15rem">
            <span class="status-pill active" style="font-size:0.65rem;padding:0.1rem 0.4rem">${formatHumanText(doc.category || 'IDENTITY')}</span>
            <span>•</span>
            <span>${doc.size ? (doc.size / 1024).toFixed(1) + ' KB' : 'Encrypted BLOB'}</span>
            <span>•</span>
            <span style="color:var(--emerald-400);font-weight:600">🔒 AES-256 Decrypted</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem">
        <button type="button" class="btn btn-outline btn-sm" onclick="window.viewDecryptedDocument('${doc.id}', '${doc.name}', '${doc.mime || 'application/octet-stream'}')" title="Preview decrypted document">
          👁️ View
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="window.downloadDecryptedDocument('${doc.id}', '${doc.name}')" title="Download decrypted file">
          ⬇️ Download
        </button>
      </div>
    </div>
  `).join('');
}

function viewReviewDocument(docId) {
  if (typeof window.viewDecryptedDocument === 'function') {
    window.viewDecryptedDocument(docId, 'Decrypted Document');
  } else {
    window.open(`/onboarding/documents/${docId}/download?inline=true`, '_blank');
  }
}

function downloadReviewDocument(docId, docName) {
  if (typeof window.downloadDecryptedDocument === 'function') {
    window.downloadDecryptedDocument(docId, docName);
  } else {
    const link = document.createElement('a');
    link.href = `/onboarding/documents/${docId}/download`;
    link.download = docName || `document_${docId}.bin`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

function renderReviewOfficerMessages(messages) {
  const container = document.getElementById('review-modal-messages-container');
  if (!container) return;

  if (messages.length === 0) {
    container.innerHTML = `
      <div style="color:var(--text-muted);font-size:0.75rem;padding:0.4rem">
        No notes or instructions dispatched to the applicant yet.
      </div>
    `;
    return;
  }

  container.innerHTML = messages.map(m => `
    <div style="font-size:0.78rem;background:rgba(255,255,255,0.04);padding:0.4rem 0.65rem;border-radius:6px;border-left:3px solid var(--brand-500)">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.2rem">
        <strong style="color:var(--brand-400)">${m.author || 'Bank Officer'} (${m.officerCode || 'EMP01'})</strong>
        <span style="font-size:0.7rem;color:var(--text-muted)">${m.timestamp ? m.timestamp.slice(0, 16).replace('T', ' ') : ''}</span>
      </div>
      <div style="color:var(--text-main)">${m.message}</div>
    </div>
  `).join('');
}

async function sendReviewOfficerMessage() {
  if (!activeReviewAppNumber) return;
  const input = document.getElementById('review-modal-new-msg');
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    showToast('Please type a message before sending', 'info');
    return;
  }

  try {
    const res = await api(`/onboarding/applications/${activeReviewAppNumber}/message`, {
      method: 'POST',
      body: { message: text }
    });

    input.value = '';
    renderReviewOfficerMessages(res.officerMessages || []);
    showToast('Officer instruction dispatched to applicant tracking portal!', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to dispatch officer message', 'error');
  }
}

// Revert Application Status (Item 16)
function promptRevertStatus(appNumber, targetStatus) {
  promptActionConfirm({
    title: `Reopen Application #${appNumber}?`,
    message: `Are you sure you want to revert this application back to status ${targetStatus}? This will restore underwriting eligibility.`,
    icon: '↩️',
    showInput: false,
    onConfirm: async () => {
      try {
        await api(`/onboarding/applications/${appNumber}/revert-status`, {
          method: 'POST',
          body: { targetStatus }
        });
        showToast(`Application #${appNumber} reverted to ${targetStatus}.`, 'success');
        await openApplicationReviewModal(appNumber);
        await loadStaffApplications();
      } catch (err) {
        showToast(err.message || 'Failed to revert application status', 'error');
      }
    }
  });
}

function openOfficeApprovalModal(appNumber) {
  const activeNum = appNumber || activeReviewAppNumber;
  if (!activeNum) return;

  const numText = document.getElementById('approve-modal-app-num-text');
  if (numText) numText.textContent = activeNum;

  // Pre-fill officer details based on logged in user session
  let officerName = 'Alexander Sterling';
  let empCode = 'EMP01';
  try {
    const session = (typeof getCurrentUserSession === 'function' ? getCurrentUserSession() : null);
    if (session) {
      const profile = session.profile || {};
      const fName = profile.firstName || '';
      const lName = profile.lastName || '';
      if (fName || lName) {
        officerName = `${fName} ${lName}`.trim();
      } else if (session.name) {
        officerName = session.name;
      }
      if (session.employeeCode) {
        empCode = session.employeeCode;
      } else if (session.id && session.id.startsWith('usr_')) {
        empCode = session.id.replace('usr_', 'EMP-').toUpperCase();
      }
    }
  } catch (e) {}

  const nameInput = document.getElementById('approve-officer-name');
  if (nameInput) nameInput.value = officerName;

  const codeInput = document.getElementById('approve-officer-code');
  if (codeInput) codeInput.value = empCode;

  const notesInput = document.getElementById('approve-officer-notes');
  if (notesInput) {
    const accType = currentReviewApplication ? currentReviewApplication.accountType : 'SAVINGS';
    notesInput.value = `Verified original identity & address documents; applicant signed and authenticated for ${formatHumanText(accType)} account.`;
  }

  const ipvChk = document.getElementById('approve-ipv-checkbox');
  if (ipvChk) ipvChk.checked = true;

  const riskSel = document.getElementById('approve-risk-category');
  if (riskSel) riskSel.value = 'LOW';

  const kycSel = document.getElementById('approve-kyc-mode');
  if (kycSel) kycSel.value = 'In-Person Verification (IPV)';

  openModal('modal-approve-office-verification');
}
window.openOfficeApprovalModal = openOfficeApprovalModal;

function confirmApproveApplication(appNumber) {
  openOfficeApprovalModal(appNumber || activeReviewAppNumber);
}

async function submitOfficeAuthorizationApproval() {
  const appNumber = activeReviewAppNumber;
  if (!appNumber) return;

  const officerName = document.getElementById('approve-officer-name')?.value?.trim();
  const officerCode = document.getElementById('approve-officer-code')?.value?.trim();
  const riskCategory = document.getElementById('approve-risk-category')?.value;
  const kycMode = document.getElementById('approve-kyc-mode')?.value;
  const ipvVerified = document.getElementById('approve-ipv-checkbox')?.checked;
  const notes = document.getElementById('approve-officer-notes')?.value?.trim();

  if (!officerName) {
    showToast('Verifying Officer Name is mandatory.', 'error');
    return;
  }
  if (!officerCode) {
    showToast('Officer Employee Code is mandatory.', 'error');
    return;
  }
  if (!riskCategory) {
    showToast('Risk Category classification is mandatory.', 'error');
    return;
  }
  if (!kycMode) {
    showToast('KYC Verification Mode is mandatory.', 'error');
    return;
  }
  if (!ipvVerified) {
    showToast('Please confirm In-Person Verification (IPV) before approval.', 'error');
    return;
  }
  if (!notes) {
    showToast('Office approval notes are mandatory.', 'error');
    return;
  }

  const submitBtn = document.getElementById('btn-submit-office-approval');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authorizing & Opening Account...';
  }

  try {
    const res = await api(`/onboarding/applications/${appNumber}/review`, {
      method: 'POST',
      body: {
        decision: 'APPROVED',
        notes: notes,
        riskCategory: riskCategory,
        kycMode: kycMode,
        ipvVerified: ipvVerified,
        verifyingOfficerName: officerName,
        officerEmpCode: officerCode
      }
    });

    showToast(`✓ Application #${appNumber} approved! New core account #${res.accountNumber} provisioned.`, 'success');
    closeModal('modal-approve-office-verification');

    // Reload the application review modal immediately to show the appended FOR OFFICE USE ONLY section!
    await openApplicationReviewModal(appNumber);
    await loadStaffApplications();
    await loadEmployeeDashboard();
  } catch (err) {
    showToast(err.message || 'Error processing application approval', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Authorize & Open Account';
    }
  }
}
window.submitOfficeAuthorizationApproval = submitOfficeAuthorizationApproval;

function confirmRejectApplication(appNumber) {
  promptActionConfirm({
    title: 'Reject Customer Application?',
    message: `Are you sure you want to reject application #${appNumber}? Please provide the formal rejection reason for compliance records.`,
    icon: '⚠️',
    showInput: true,
    inputLabel: 'Rejection Reason / Non-Compliance Note:',
    onConfirm: async (reason) => {
      let officerName = 'Alexander Sterling';
      let empCode = 'EMP01';
      try {
        const session = (typeof getCurrentUserSession === 'function' ? getCurrentUserSession() : null);
        if (session) {
          const profile = session.profile || {};
          const fName = profile.firstName || '';
          const lName = profile.lastName || '';
          if (fName || lName) officerName = `${fName} ${lName}`.trim();
          if (session.employeeCode) empCode = session.employeeCode;
        }
      } catch (e) {}

      await reviewCustomerApplication(appNumber, 'REJECTED', reason || 'Non-compliant documents or failed underwriting verification', {
        verifyingOfficerName: officerName,
        officerEmpCode: empCode
      });
      await openApplicationReviewModal(appNumber);
    }
  });
}

async function reviewCustomerApplication(appNumber, decision, notes = null, extra = {}) {
  try {
    const payload = {
      decision,
      notes,
      ...extra
    };
    const res = await api(`/onboarding/applications/${appNumber}/review`, {
      method: 'POST',
      body: payload
    });

    if (decision === 'APPROVED') {
      showToast(`Application #${appNumber} approved! New account #${res.accountNumber} opened.`, 'success');
    } else {
      showToast(`Application #${appNumber} rejected.`, 'info');
    }

    await loadStaffApplications();
    await loadEmployeeDashboard();
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- AUDIT & SYSTEM RESET
async function promptResetPlatform() {
  promptActionConfirm({
    title: 'Reset Sandbox Test Ledger?',
    message: 'Are you sure you want to reset all sandbox test data? This will restore the database to its pristine state.',
    icon: '⚠️',
    showInput: false,
    onConfirm: async () => {
      try {
        await api('/admin/reset', { method: 'POST' });
        showToast('Platform database successfully wiped and re-seeded!', 'info');
        await loadEmployeeDashboard();
        await loadStaffApplications();
      } catch (err) {
        // Handled
      }
    }
  });
}
