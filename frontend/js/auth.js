/**
 * Authentication Module: Unified Login, Role Tracking, and Staff Onboarding
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

let currentUser = null;

// Initialize Authentication state
async function checkAuthSession() {
  const token = getToken();
  if (!token) {
    const p = window.location.pathname;
    if (p.startsWith('/app') || p.startsWith('/dashboard') || p.startsWith('/ui')) {
      window.location.href = '/login';
      return false;
    }
    renderAuthScreen();
    return false;
  }

  try {
    const userProfile = await api('/users/me');
    currentUser = userProfile;
    setCurrentUserSession(userProfile);
    renderAppScreen(userProfile);
    return true;
  } catch (err) {
    console.warn('Session expired or invalid token:', err);
    setToken(null);
    setCurrentUserSession(null);
    localStorage.removeItem('neobank_token');
    localStorage.removeItem('neobank_user');
    window.location.href = '/login';
    return false;
  }
}

// Unified Login for Customer, Employee, Admin
async function handleLogin(email, password) {
  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: { email, password }
    });

    setToken(res.accessToken);
    currentUser = res.user || { email, role: res.role };
    setCurrentUserSession(currentUser);

    const greetingName = currentUser.profile ? currentUser.profile.firstName : email;
    showToast(`Authenticated as ${res.role}! Welcome, ${greetingName}.`, 'success');
    renderAppScreen(currentUser);
  } catch (err) {
    // Handled in api() toast
  }
}

// Employee Registration (New Bank Staff)
async function handleEmployeeRegister(payload) {
  try {
    const res = await api('/auth/register-employee', {
      method: 'POST',
      body: payload
    });

    showToast(`Staff member ${payload.profile.firstName} registered successfully! Please sign in.`, 'success');
    switchAuthView('login');
    const emailField = document.getElementById('login-email');
    if (emailField) {
      emailField.value = payload.email;
      const pwdField = document.getElementById('login-password');
      if (pwdField) pwdField.focus();
    }
  } catch (err) {
    // Handled in api() toast
  }
}

// Perform Logout
async function handleLogout() {
  try {
    await api('/auth/logout', { method: 'POST' });
  } catch (e) {
    // ignore network errors on logout
  }

  setToken(null);
  setCurrentUserSession(null);
  currentUser = null;
  localStorage.removeItem('neobank_token');
  localStorage.removeItem('neobank_user');
  sessionStorage.clear();
  window.location.href = '/login';
}

// Demo Account Fast-Fillers (for testing both roles effortlessly)
function fillDemoCredentials(role) {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  
  if (role === 'CUSTOMER') {
    emailInput.value = 'customer@bank.test';
    passwordInput.value = 'Customer@1234';
    showToast('Customer credentials filled. Click Authenticate to enter.', 'info');
  } else if (role === 'EMPLOYEE' || role === 'ADMIN') {
    emailInput.value = 'admin@bank.test';
    passwordInput.value = 'Admin@1234';
    showToast('Bank Staff / Admin credentials filled. Click Authenticate to enter.', 'info');
  }
}

// Switch Auth Screens (Unified Sign In, Open Bank Account Wizard, Track Application, Staff Onboarding)
function switchAuthView(view) {
  const views = ['login', 'onboarding', 'track', 'employee-register'];
  views.forEach(v => {
    const el = document.getElementById(`auth-view-${v}`);
    if (el) el.style.display = (v === view) ? 'block' : 'none';
  });

  if (view === 'onboarding') {
    loadAccountCatalog();
    goToOnboardingStep(1);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
