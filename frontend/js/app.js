/**
 * NeoBank Master Application Router & UI Shell Orchestrator
 */

// Centralized Utilities from utils.js & api.js
var formatHumanText = (window.NeoBankUtils && window.NeoBankUtils.formatHumanText) || window.formatHumanText || function(val) { return val || ''; };
var showToast = window.showToast || function(msg, type) { console.log(`[Toast ${type || 'info'}]:`, msg); };

// Application startup
document.addEventListener('DOMContentLoaded', async () => {
  setupGlobalEventListeners();
  await checkAuthSession();
});

function setupGlobalEventListeners() {
  // Unified Login form handler
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      await handleLogin(email, password);
    });
  }

  // Employee Registration form handler
  const empRegForm = document.getElementById('form-employee-register');
  if (empRegForm) {
    empRegForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        email: empRegForm.email.value.trim(),
        password: empRegForm.password.value,
        employeeCode: empRegForm.employeeCode.value.trim(),
        department: empRegForm.department.value,
        role: empRegForm.role.value,
        profile: {
          firstName: empRegForm.firstName.value.trim(),
          lastName: empRegForm.lastName.value.trim(),
          dob: empRegForm.dob.value,
          phone: empRegForm.phone.value.trim(),
          address: {
            line1: empRegForm.addressLine.value.trim(),
            city: empRegForm.city.value.trim(),
            postalCode: empRegForm.postalCode.value.trim(),
            country: empRegForm.country.value.trim()
          }
        }
      };
      await handleEmployeeRegister(payload);
    });
  }

  // Customer Account Opening Multi-step Form
  const custAppForm = document.getElementById('form-customer-application');
  if (custAppForm) {
    custAppForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitCustomerApplication(custAppForm);
    });
  }

  // Public Application Tracking Form
  const trackForm = document.getElementById('form-track-app');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const num = trackForm.appNumber.value;
      await trackApplicationStatus(num);
    });
  }

  // Close modals when clicking outside backdrop
  document.querySelectorAll('.modal-overlay, .signature-modal-backdrop, .db-modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (overlay.id && typeof window.closeModal === 'function') {
          window.closeModal(overlay.id);
        } else {
          overlay.classList.remove('active');
          setTimeout(() => { overlay.style.display = 'none'; }, 200);
        }
      }
    });
  });

  // Global Escape key handler to close the topmost active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModals = Array.from(document.querySelectorAll('.modal-overlay.active, .signature-modal-backdrop.active, .db-modal-overlay.active'));
      if (activeModals.length > 0) {
        activeModals.sort((a, b) => {
          const zA = parseInt(window.getComputedStyle(a).zIndex, 10) || 0;
          const zB = parseInt(window.getComputedStyle(b).zIndex, 10) || 0;
          return zB - zA;
        });
        const topModal = activeModals[0];
        if (topModal.id && typeof window.closeModal === 'function') {
          window.closeModal(topModal.id);
        } else {
          topModal.classList.remove('active');
          topModal.style.display = 'none';
        }
      }
    }
  });
}

// ----------------------------------------------------------------- SCREEN SWITCHING
function renderAuthScreen() {
  document.getElementById('screen-auth').style.display = 'flex';
  document.getElementById('screen-app').style.display = 'none';
  document.getElementById('user-profile-badge').style.display = 'none';
  switchAuthView('login');
}

function renderAppScreen(user) {
  document.getElementById('screen-auth').style.display = 'none';
  document.getElementById('screen-app').style.display = 'flex';
  document.getElementById('user-profile-badge').style.display = 'flex';

  // Populate top app bar profile
  const profile = user.profile || {};
  const displayName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.email;
  document.getElementById('header-user-name').textContent = displayName;

  const roleBadge = document.getElementById('header-role-badge');
  const role = (user.role || 'CUSTOMER').toUpperCase();
  const isSuperAdmin = role === 'SUPER_ADMIN' || user.email === 'admin@bank.test';

  roleBadge.textContent = isSuperAdmin ? 'Super Admin' : (role === 'ADMIN' ? 'Bank Admin' : (role === 'EMPLOYEE' ? 'Bank Staff' : 'Customer'));
  roleBadge.className = `role-badge ${role.toLowerCase()}`;

  // Restore sidebar state from localStorage (Item 17)
  try {
    if (localStorage.getItem('nb_sidebar_collapsed') === '1') {
      const sidebar = document.getElementById('main-app-sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
      const btn = document.getElementById('btn-toggle-sidebar');
      if (btn) {
        const icon = btn.querySelector('.toggle-icon');
        const label = btn.querySelector('.toggle-label');
        if (icon) { icon.style.transform = 'rotate(180deg)'; }
        if (label) label.textContent = 'Expand';
      }
    }
  } catch(e) {}

  // Role-Based Screen Rendering
  if (role === 'ADMIN' || role === 'EMPLOYEE' || role === 'SUPER_ADMIN') {
    // Show Employee Navigation & Panels
    document.getElementById('sidebar-customer-nav').style.display = 'none';
    document.getElementById('sidebar-employee-nav').style.display = 'flex';
    
    document.getElementById('customer-views-container').style.display = 'none';
    document.getElementById('employee-views-container').style.display = 'block';

    // Item 21: Super Admin Exclusive Employee Onboarding Tab
    const onboardNavBtn = document.getElementById('nav-emp-onboard');
    if (onboardNavBtn) {
      onboardNavBtn.style.display = isSuperAdmin ? 'flex' : 'none';
    }

    // SQL Database GUI Workbench Navigation: Restricted to Super Admin, Admins, or staff explicitly granted hasSqlAccess
    const hasSqlAccess = isSuperAdmin || role === 'ADMIN' || Boolean(user.hasSqlAccess === true || user.hasSqlAccess === 1);
    const sqlGuiNavBtn = document.getElementById('nav-emp-sql-gui');
    if (sqlGuiNavBtn) {
      sqlGuiNavBtn.style.display = hasSqlAccess ? 'flex' : 'none';
    }

    // Item 9 & 13: Subpath Route Check (/app/account_applications)
    if (window.location.pathname.includes('/account_applications') || window.location.pathname.includes('account_applications')) {
      switchEmployeeTab('emp-applications');
    } else {
      switchEmployeeTab('emp-dashboard');
      loadEmployeeDashboard();
    }
  } else {
    // Show Customer Navigation & Panels
    document.getElementById('sidebar-customer-nav').style.display = 'flex';
    document.getElementById('sidebar-employee-nav').style.display = 'none';

    document.getElementById('customer-views-container').style.display = 'block';
    document.getElementById('employee-views-container').style.display = 'none';

    switchCustomerTab('cust-dashboard');
    loadCustomerDashboard();
  }
}

// ----------------------------------------------------------------- SIDEBAR EXPAND/COLLAPSE (Item 17)
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('main-app-sidebar');
  if (!sidebar) return;

  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');

  const btn = document.getElementById('btn-toggle-sidebar');
  if (btn) {
    const icon = btn.querySelector('.toggle-icon');
    const label = btn.querySelector('.toggle-label');
    if (icon) {
      // Animate the chevron rotation instead of swapping text
      icon.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
      icon.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    if (label) label.textContent = isCollapsed ? 'Expand' : 'Collapse';
  }

  try {
    localStorage.setItem('nb_sidebar_collapsed', isCollapsed ? '1' : '0');
  } catch(e) {}
}

// ----------------------------------------------------------------- MODAL ACCOUNT TYPE ICON UPDATER
function updateModalAccountTypeIcon(type) {
  const iconEl = document.getElementById('modal-account-type-icon');
  const labelEl = document.getElementById('modal-account-type-label');

  const configs = {
    CHECKING: {
      label: 'Checking Account (With Overdraft)',
      bg: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(99,102,241,0.05))',
      color: 'var(--brand-500)',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>'
    },
    SAVINGS: {
      label: 'High-Yield Savings Account',
      bg: 'linear-gradient(135deg,rgba(16,185,129,0.25),rgba(16,185,129,0.05))',
      color: 'var(--emerald-400)',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2z"/><path d="M12 6v6l4 2"/></svg>'
    },
    BUSINESS: {
      label: 'Commercial Business Account',
      bg: 'linear-gradient(135deg,rgba(245,158,11,0.25),rgba(245,158,11,0.05))',
      color: 'var(--amber-400)',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:22px;height:22px"><path d="M3 9l9-6 9 6v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
    }
  };

  const cfg = configs[type] || configs.CHECKING;
  if (iconEl) {
    iconEl.style.background = cfg.bg;
    iconEl.style.color = cfg.color;
    iconEl.innerHTML = cfg.svg;
  }
  if (labelEl) labelEl.textContent = cfg.label;
}

// ----------------------------------------------------------------- TAB SWITCHERS
function switchCustomerTab(tabId) {
  document.querySelectorAll('#customer-views-container > section').forEach(sec => {
    sec.style.display = 'none';
  });

  document.querySelectorAll('#sidebar-customer-nav .nav-item').forEach(btn => {
    btn.classList.remove('active');
  });

  const panel = document.getElementById(`panel-${tabId}`);
  if (panel) panel.style.display = 'block';

  const btn = document.getElementById(`nav-${tabId}`);
  if (btn) btn.classList.add('active');

  if (tabId === 'cust-loans') {
    loadLoansHub();
  } else if (tabId === 'cust-update-app') {
    // Populate linked account dropdown (Item 20)
    populateCustomerUpdateAccounts();
  }
}

function populateCustomerUpdateAccounts() {
  const select = document.getElementById('update-app-account-select');
  if (!select) return;

  const accounts = (typeof currentCustomerAccounts !== 'undefined' && currentCustomerAccounts.length) 
    ? currentCustomerAccounts 
    : (window.customerAccountsCache || []);

  if (accounts.length === 0) {
    select.innerHTML = '<option value="">-- No Active Accounts Found --</option>';
  } else {
    select.innerHTML = accounts.map(a => `
      <option value="${a.accountNumber}">${a.nickname || a.type} (*${a.accountNumber.slice(-4)}) - Balance: $${Number(a.balance).toFixed(2)}</option>
    `).join('');
  }
}

function switchEmployeeTab(tabId) {
  document.querySelectorAll('#employee-views-container > section').forEach(sec => {
    sec.style.display = 'none';
  });

  document.querySelectorAll('#sidebar-employee-nav .nav-item').forEach(btn => {
    btn.classList.remove('active');
  });

  const panel = document.getElementById(`panel-${tabId}`);
  if (panel) panel.style.display = 'block';

  const btn = document.getElementById(`nav-${tabId}`);
  if (btn) btn.classList.add('active');

  if (tabId === 'emp-applications') {
    loadStaffApplications();
  } else if (tabId === 'emp-dashboard') {
    loadEmployeeDashboard();
  }
}

// ----------------------------------------------------------------- CUSTOMER UPDATE APPLICATION (Item 20)
async function submitCustomerUpdateApplication(form) {
  try {
    const accNum = form.accountNumber.value;
    if (!accNum) {
      showToast('Please select a linked account number to modify', 'error');
      return;
    }

    const payload = {
      accountNumber: accNum,
      phone: form.phone.value.trim() || undefined,
      email: form.email.value.trim() || undefined,
      addressLine: form.addressLine.value.trim() || undefined,
      city: form.city.value.trim() || undefined,
      postalCode: form.postalCode.value.trim() || undefined,
      cardScheme: form.cardScheme.value || 'RUPAY',
      reason: form.reason.value.trim()
    };

    const res = await api('/onboarding/request-update', {
      method: 'POST',
      body: payload
    });

    showToast(`✓ Profile update request registered under #${res.applicationNumber} (Type: UPDATE)!`, 'success');
    form.reset();
    switchCustomerTab('cust-dashboard');
    await loadCustomerDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to submit account update request', 'error');
  }
}

// ----------------------------------------------------------------- EMPLOYEE ONBOARDING & SQL ACCESS POPUP (Item 21)
let pendingEmployeeRegistrationData = null;

function initiateEmployeeOnboarding(form) {
  const rawPhone = (form.phone && form.phone.value) ? form.phone.value.trim() : '+447700900999';
  const cleanPhone = rawPhone.replace(/[\s\-\(\)\.]/g, '') || '+447700900999';

  const dobVal = (form.dob && form.dob.value) ? form.dob.value : '1992-04-18';
  const addressLine = (form.addressLine && form.addressLine.value.trim()) ? form.addressLine.value.trim() : '10 Fleet Street';
  const cityVal = (form.city && form.city.value.trim()) ? form.city.value.trim() : 'London';
  const postalVal = (form.postalCode && form.postalCode.value.trim()) ? form.postalCode.value.trim() : 'EC4Y 1AA';
  const countryVal = (form.country && form.country.value.trim()) ? form.country.value.trim().toUpperCase() : 'GB';

  pendingEmployeeRegistrationData = {
    email: form.email.value.trim().toLowerCase(),
    password: form.password.value,
    employeeCode: form.employeeCode.value.trim().toUpperCase(),
    department: form.department.value,
    role: form.role.value,
    profile: {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      dob: dobVal,
      phone: cleanPhone,
      address: {
        line1: addressLine,
        city: cityVal,
        postalCode: postalVal,
        country: countryVal
      }
    }
  };

  // Open Database Access Confirmation Modal (Item 21)
  const modal = document.getElementById('modal-confirm-sql-access');
  if (modal) {
    modal.classList.add('active');
  } else {
    finalizeEmployeeOnboarding(false);
  }
}

async function finalizeEmployeeOnboarding(hasSqlAccess) {
  closeModal('modal-confirm-sql-access');
  if (!pendingEmployeeRegistrationData) return;

  try {
    pendingEmployeeRegistrationData.hasSqlAccess = Boolean(hasSqlAccess);
    const res = await api('/auth/register-employee', {
      method: 'POST',
      body: pendingEmployeeRegistrationData
    });

    showToast(`Staff member ${pendingEmployeeRegistrationData.profile.firstName} onboarded successfully! (SQL GUI Access: ${hasSqlAccess ? 'GRANTED' : 'RESTRICTED'})`, 'success');
    
    const form = document.getElementById('form-emp-onboard');
    if (form) form.reset();

    pendingEmployeeRegistrationData = null;
    await loadEmployeeDashboard();
  } catch (err) {
    showToast(err.message || 'Failed to onboard employee', 'error');
  }
}

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
