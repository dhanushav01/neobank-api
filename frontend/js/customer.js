/**
 * Customer Portal Operations: Accounts, Cards, Transfers, Loans, KYC, and CRUD Actions
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

let customerAccounts = [];
let customerCards = [];
let activeTransferChallenge = null;

// Load all customer data
async function loadCustomerDashboard() {
  try {
    const [summary, accountsRes, cardsRes, kycRes] = await Promise.all([
      api('/users/me/summary'),
      api('/accounts'),
      api('/cards'),
      api('/kyc/applications')
    ]);

    customerAccounts = accountsRes.data || [];
    customerCards = cardsRes || [];

    renderCustomerOverview(summary, customerAccounts, customerCards, kycRes.data || []);
  } catch (err) {
    console.error('Failed to load customer dashboard:', err);
  }
}

// ----------------------------------------------------------------- RENDER OVERVIEW
function renderCustomerOverview(summary, accounts, cards, kycList) {
  // Balance calculation
  const totalBalanceUSD = summary.totalBalanceByCurrency ? (summary.totalBalanceByCurrency.USD || 0) : 0;
  const balanceEl = document.getElementById('cust-total-balance');
  if (balanceEl) {
    balanceEl.textContent = `$${Number(totalBalanceUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  const accountsCountEl = document.getElementById('cust-accounts-count');
  if (accountsCountEl) accountsCountEl.textContent = summary.accountsCount || 0;

  const cardsCountEl = document.getElementById('cust-cards-count');
  if (cardsCountEl) cardsCountEl.textContent = summary.cardsCount || 0;

  const loansCountEl = document.getElementById('cust-loans-count');
  if (loansCountEl) loansCountEl.textContent = summary.activeLoansCount || 0;

  // Render Accounts List
  renderAccountsList(accounts);

  // Render Cards List
  renderCardsList(cards);

  // Update KYC Status Pill
  const latestKyc = kycList.length > 0 ? kycList[0] : null;
  renderKycBanner(latestKyc);
}

function renderKycBanner(kyc) {
  const banner = document.getElementById('kyc-status-banner');
  if (!banner) return;

  if (!kyc) {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:12px">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <span style="color:var(--amber-400);font-size:1.25rem">⚠️</span>
          <div>
            <div style="font-weight:700;color:var(--text-main)">KYC Verification Incomplete</div>
            <div style="font-size:0.8rem;color:var(--text-secondary)">Identity verification is required before opening new accounts or applying for loans.</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="openModal('modal-submit-kyc')">Submit ID Documents</button>
      </div>
    `;
  } else if (kyc.status === 'SUBMITTED') {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:12px">
        <span style="color:var(--amber-400)">⏳</span>
        <div style="font-size:0.85rem;color:var(--text-secondary)">Your KYC application <strong style="color:var(--text-main)">#${kyc.id}</strong> is currently pending bank staff review.</div>
      </div>
    `;
  } else if (kyc.status === 'APPROVED') {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px">
        <span style="color:var(--emerald-400)">✓</span>
        <div style="font-size:0.85rem;color:var(--emerald-400);font-weight:600">Identity Verified & Fully Approved. All banking features are unlocked.</div>
      </div>
    `;
  } else if (kyc.status === 'REJECTED') {
    banner.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.25);border-radius:12px">
        <div style="display:flex;align-items:center;gap:0.75rem">
          <span style="color:var(--rose-500)">✕</span>
          <div>
            <div style="font-weight:700;color:var(--rose-500)">KYC Rejected: ${kyc.reason || 'Verification failed'}</div>
            <div style="font-size:0.8rem;color:var(--text-secondary)">Please submit updated documents to verify your account.</div>
          </div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="openModal('modal-submit-kyc')">Re-Submit KYC</button>
      </div>
    `;
  }
}

// ----------------------------------------------------------------- ACCOUNTS CRUD
function renderAccountsList(accounts) {
  const container = document.getElementById('accounts-cards-container');
  if (!container) return;

  // Also populate the transfer-from-account dropdown if present
  const transferSelect = document.getElementById('transfer-from-account');
  if (transferSelect && accounts.length > 0) {
    transferSelect.innerHTML = accounts.map(a => 
      `<option value="${a.id}">${a.nickname || formatHumanText(a.type)} (${a.currency} $${Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}) - ${a.accountNumber}</option>`
    ).join('');
  }

  if (accounts.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="padding:2.75rem 2rem;text-align:center;grid-column:1/-1">
        <div style="font-size:2.8rem;margin-bottom:0.75rem">🏛️</div>
        <h3 style="font-size:1.25rem;font-weight:800;color:var(--text-main);margin-bottom:0.5rem">No Active Accounts Found</h3>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem;max-width:420px;margin-left:auto;margin-right:auto;font-size:0.9rem">
          Provision your first high-yield checking or savings account with instant SEPA and Fedwire clearing.
        </p>
        <button class="btn btn-primary" onclick="openModal('modal-create-account')">
          <span>+ Open Your First Account</span>
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = accounts.map(acc => {
    const isFrozen = acc.status === 'FROZEN';
    const isChecking = (acc.type || '').toUpperCase() === 'CHECKING';
    const isSavings = (acc.type || '').toUpperCase() === 'SAVINGS';
    const currencyFlag = acc.currency === 'USD' ? '🇺🇸' : (acc.currency === 'EUR' ? '🇪🇺' : (acc.currency === 'GBP' ? '🇬🇧' : '🌐'));
    const currencyJurisdiction = acc.currency === 'USD' ? 'US Fedwire System' : (acc.currency === 'EUR' ? 'SEPA Clearstream' : (acc.currency === 'GBP' ? 'Bank of England' : 'Global SWIFT'));
    const badgeTypeLabel = isChecking ? 'Primary Checking' : (isSavings ? 'High-Yield Vault' : formatHumanText(acc.type));
    const badgeTypeIcon = isChecking ? '⚡' : (isSavings ? '💎' : '🏛️');

    return `
      <div class="glass-card account-card-elevated" style="padding:1.6rem;position:relative">
        <!-- Top Status & Currency Ribbon -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.2rem">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:1.15rem">${currencyFlag}</span>
            <span style="font-size:0.72rem;font-weight:700;letter-spacing:0.06em;color:var(--text-secondary);text-transform:uppercase">${currencyJurisdiction}</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem">
            <span class="status-pill ${acc.status.toLowerCase()}">${isFrozen ? '❄️ Frozen' : '● ' + formatHumanText(acc.status)}</span>
          </div>
        </div>

        <!-- Account Title & Identifier -->
        <div style="margin-bottom:1.25rem">
          <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.76rem;font-weight:700;color:var(--brand-400);text-transform:uppercase;letter-spacing:0.05em">
            <span>${badgeTypeIcon}</span>
            <span>${badgeTypeLabel}</span>
          </div>
          <h3 style="font-size:1.25rem;font-weight:800;color:var(--text-main);margin-top:0.25rem;letter-spacing:-0.02em">
            ${acc.nickname || formatHumanText(acc.type)}
          </h3>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.35rem">
            <span style="font-family:var(--font-mono, monospace);font-size:0.82rem;color:var(--text-secondary)">Acct: <strong style="color:var(--text-main);letter-spacing:0.05em">${acc.accountNumber}</strong></span>
            <button type="button" onclick="navigator.clipboard && navigator.clipboard.writeText('${acc.accountNumber}'); showToast('Account number ${acc.accountNumber} copied!', 'success');" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:0;font-size:0.85rem;transition:color 0.2s" title="Copy Account Number" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='var(--text-muted)'">
              📋
            </button>
          </div>
        </div>

        <!-- Balance Display with Tabular Lining Numerals -->
        <div style="padding:1rem 1.1rem;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:14px;margin-bottom:1.25rem">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted)">Available Balance</div>
            ${isSavings ? '<span style="font-size:0.72rem;font-weight:700;color:var(--emerald-400);background:rgba(16,185,129,0.12);padding:0.15rem 0.45rem;border-radius:6px">+4.20% APY</span>' : ''}
          </div>
          <div style="font-size:1.85rem;font-weight:800;color:var(--text-main);letter-spacing:-0.03em;margin-top:0.25rem;font-variant-numeric:tabular-nums">
            <span style="font-size:1.1rem;font-weight:600;color:var(--text-secondary);margin-right:0.25rem">${acc.currency}</span>$${Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          ${acc.overdraftLimit > 0 ? `<div style="font-size:0.72rem;color:var(--emerald-400);margin-top:0.3rem">Overdraft Protection: $${acc.overdraftLimit.toLocaleString()}</div>` : ''}
        </div>

        <!-- Quick Action Buttons -->
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:0.4rem">
          <button class="btn btn-outline btn-sm" style="padding:0.45rem 0.25rem;font-size:0.75rem;justify-content:center;background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.25);color:var(--emerald-400)" onclick="promptDeposit('${acc.id}', '${acc.currency}')" title="Deposit funds">
            <span>+ Deposit</span>
          </button>
          <button class="btn btn-outline btn-sm" style="padding:0.45rem 0.25rem;font-size:0.75rem;justify-content:center" onclick="promptWithdraw('${acc.id}', '${acc.currency}')" title="Withdraw funds">
            <span>- Withdraw</span>
          </button>
          <button class="btn btn-outline btn-sm" style="padding:0.45rem 0.25rem;font-size:0.75rem;justify-content:center" onclick="loadAccountTransactions('${acc.id}', '${acc.accountNumber}')" title="View transactions ledger">
            <span>Ledger</span>
          </button>
          <button class="btn btn-outline btn-sm" style="padding:0.45rem 0.25rem;font-size:0.75rem;justify-content:center;${isFrozen ? 'color:var(--amber-400);border-color:rgba(245,158,11,0.4)' : ''}" onclick="toggleFreezeAccount('${acc.id}', ${isFrozen})" title="${isFrozen ? 'Unfreeze account' : 'Freeze account'}">
            <span>${isFrozen ? 'Unfreeze' : 'Freeze'}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Open Account Action
async function submitOpenAccount(form) {
  try {
    // Look up user's approved KYC ID
    const kycRes = await api('/kyc/applications');
    const approved = (kycRes.data || []).find(k => k.status === 'APPROVED');
    if (!approved) {
      showToast('You must have an APPROVED KYC before opening an account.', 'error');
      openModal('modal-submit-kyc');
      return;
    }

    const payload = {
      kycId: approved.id,
      type: form.type.value,
      currency: form.currency.value,
      initialDeposit: parseFloat(form.initialDeposit.value || 0),
      overdraftLimit: form.type.value === 'CHECKING' ? parseFloat(form.overdraftLimit.value || 0) : 0,
      nickname: form.nickname.value || undefined
    };

    await api('/accounts', {
      method: 'POST',
      body: payload
    });

    showToast('New bank account opened successfully!', 'success');
    closeModal('modal-create-account');
    await loadCustomerDashboard();
  } catch (err) {
    // Handled in api()
  }
}

// Deposit Action
function promptDeposit(accountId, currency) {
  document.getElementById('deposit-account-id').value = accountId;
  document.getElementById('deposit-currency-label').textContent = currency;
  openModal('modal-deposit');
}

async function submitDeposit(form) {
  try {
    const accountId = form.accountId.value;
    const amount = parseFloat(form.amount.value);
    const note = form.note.value;

    await api(`/accounts/${accountId}/deposit`, {
      method: 'POST',
      body: { amount, note, channel: 'ONLINE' }
    });

    showToast(`Successfully deposited $${amount.toFixed(2)}`, 'success');
    closeModal('modal-deposit');
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

// Withdraw Action
function promptWithdraw(accountId, currency) {
  document.getElementById('withdraw-account-id').value = accountId;
  document.getElementById('withdraw-currency-label').textContent = currency;
  openModal('modal-withdraw');
}

async function submitWithdraw(form) {
  try {
    const accountId = form.accountId.value;
    const amount = parseFloat(form.amount.value);
    const note = form.note.value;

    await api(`/accounts/${accountId}/withdraw`, {
      method: 'POST',
      body: { amount, note, channel: 'ONLINE' }
    });

    showToast(`Successfully withdrew $${amount.toFixed(2)}`, 'success');
    closeModal('modal-withdraw');
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

// Freeze/Unfreeze Account
async function toggleFreezeAccount(accountId, isFrozen) {
  try {
    const action = isFrozen ? 'unfreeze' : 'freeze';
    await api(`/accounts/${accountId}/${action}`, { method: 'POST' });
    showToast(`Account successfully ${action}d.`, 'info');
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

// Load Transactions View
async function loadAccountTransactions(accountId, accountNumber) {
  try {
    const res = await api(`/accounts/${accountId}/transactions?limit=50`);
    const txList = res.data || [];

    document.getElementById('tx-modal-title').textContent = `Institutional Ledger • Acct: ${accountNumber}`;
    const tbody = document.getElementById('tx-table-body');
    if (tbody) {
      if (txList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:3rem 1.5rem;color:var(--text-secondary)">
          <div style="font-size:2rem;margin-bottom:0.5rem">📜</div>
          <div style="font-weight:700;color:var(--text-main);margin-bottom:0.25rem">No Transactions Recorded</div>
          <div style="font-size:0.82rem">Funds transfers and ledger postings will appear here in real time.</div>
        </td></tr>`;
      } else {
        tbody.innerHTML = txList.map(t => {
          const isDebit = t.amount < 0;
          const typeUpper = (t.type || '').toUpperCase();
          const txIcon = isDebit ? (typeUpper.includes('TRANSFER') ? '📤' : (typeUpper.includes('WITHDRAW') ? '🏧' : '💳')) : '📥';
          let dateStr = t.createdAt || '';
          if (dateStr) {
            try {
              const d = new Date(dateStr);
              dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } catch (e) {
              dateStr = dateStr.replace('T', ' ').substring(0, 19);
            }
          }
          return `
            <tr>
              <td style="font-family:var(--font-mono, monospace);font-size:0.8rem;color:var(--text-secondary)">${dateStr}</td>
              <td>
                <span class="status-pill ${t.type.toLowerCase()}" style="display:inline-flex;align-items:center;gap:0.35rem">
                  <span>${txIcon}</span>
                  <span>${formatHumanText(t.type)}</span>
                </span>
              </td>
              <td style="font-weight:600;color:var(--text-main)">${t.reference || 'Real-time Clearing Wire'}</td>
              <td style="font-weight:800;font-variant-numeric:tabular-nums;font-size:0.95rem;color:${isDebit ? 'var(--rose-500)' : 'var(--emerald-400)'}">
                ${isDebit ? '-' : '+'}$${Math.abs(Number(t.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </td>
              <td>
                ${isDebit && !t.disputed ? `
                  <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.55rem;font-size:0.75rem" onclick="promptDispute('${t.id}', ${Math.abs(t.amount)})">Dispute</button>
                ` : t.disputed ? `<span class="status-pill under_review">Disputed</span>` : '<span style="color:var(--text-muted);font-size:0.75rem">Settled ✓</span>'}
              </td>
            </tr>
          `;
        }).join('');
      }
    }
    openModal('modal-transactions');
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- TRANSFERS & OTP
async function submitTransfer(form) {
  try {
    const payload = {
      fromAccountId: form.fromAccountId.value,
      currency: form.currency.value,
      amount: parseFloat(form.amount.value),
      reference: form.reference.value || undefined,
      destination: {
        type: form.destinationType.value,
        name: form.recipientName.value,
        accountNumber: form.destinationType.value === 'INTERNAL' ? form.accountNumber.value : undefined,
        iban: form.destinationType.value === 'EXTERNAL' ? form.iban.value : undefined,
        bankCode: form.destinationType.value === 'EXTERNAL' ? form.bankCode.value : undefined
      }
    };

    const res = await api('/transfers', {
      method: 'POST',
      body: payload
    });

    if (res.status === 'PENDING_OTP') {
      activeTransferChallenge = res;
      document.getElementById('otp-transfer-id').value = res.id;
      document.getElementById('otp-challenge-id').value = res.otpChallengeId;
      document.getElementById('otp-test-hint').textContent = `High-value transfer (> $1,000). Test verification code: ${res.testModeOtp}`;
      openModal('modal-otp-verify');
      showToast('High-value transfer! Please enter the 6-digit verification code.', 'info');
    } else {
      showToast(`Transfer of $${payload.amount} completed successfully!`, 'success');
      form.reset();
      await loadCustomerDashboard();
    }
  } catch (err) {
    // Handled
  }
}

async function submitOtpConfirmation(form) {
  try {
    const transferId = form.transferId.value;
    const otpChallengeId = form.otpChallengeId.value;
    const otp = form.otp.value;

    await api(`/transfers/${transferId}/confirm`, {
      method: 'POST',
      body: { otpChallengeId, otp }
    });

    showToast('Transfer authorized and completed successfully!', 'success');
    closeModal('modal-otp-verify');
    form.reset();
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- CARDS CRUD
function renderCardsList(cards) {
  const container = document.getElementById('cards-display-container');
  const containerTab = document.getElementById('cards-display-container-tab');
  if (!container && !containerTab) return;

  if (cards.length === 0) {
    const emptyHtml = `
      <div class="glass-card" style="padding:2.5rem;text-align:center;grid-column:1/-1">
        <div style="font-size:2.8rem;margin-bottom:0.75rem">💳</div>
        <h3 style="font-size:1.2rem;font-weight:800;color:var(--text-main);margin-bottom:0.4rem">No Active Debit Cards</h3>
        <p style="color:var(--text-secondary);margin-bottom:1.5rem;max-width:380px;margin-left:auto;margin-right:auto;font-size:0.88rem">
          Generate an instant brushed titanium virtual debit card with zero foreign exchange fees and tokenized Apple/Google Pay.
        </p>
        <button class="btn btn-primary" onclick="openModal('modal-issue-card')">
          <span>+ Issue New Card</span>
        </button>
      </div>
    `;
    if (container) container.innerHTML = emptyHtml;
    if (containerTab) containerTab.innerHTML = emptyHtml;
    return;
  }

  const cardsHtml = cards.map(c => {
    const isBlocked = c.status === 'BLOCKED';
    const isMastercard = (c.network || '').toUpperCase() === 'MASTERCARD';
    return `
      <div class="virtual-card" style="position:relative;overflow:hidden">
        <div style="display:flex;justify-content:space-between;align-items:center;position:relative;z-index:2">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <span style="font-size:0.85rem;font-weight:900;letter-spacing:0.12em;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.5)">NEOBANK</span>
            <span style="font-size:0.6rem;font-weight:700;padding:0.1rem 0.4rem;border-radius:4px;background:rgba(255,255,255,0.15);color:#fff">TITANIUM</span>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem">
            <span class="status-pill ${c.status.toLowerCase()}" style="font-size:0.68rem;padding:0.2rem 0.55rem;background:${isBlocked ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'};color:${isBlocked ? '#fca5a5' : '#6ee7b7'};border:1px solid ${isBlocked ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)'}">
              ${isBlocked ? '🔒 Locked' : '● Active'}
            </span>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:0.8rem;margin:1.25rem 0 1rem;position:relative;z-index:2">
          <div class="card-chip"></div>
          <svg style="width:20px;height:20px;color:rgba(255,255,255,0.7)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.5 16.5a5 5 0 010-9M12 19a8.5 8.5 0 000-14M15.5 21.5a12 12 0 000-19" />
          </svg>
        </div>

        <div class="card-number" style="letter-spacing:3px;font-size:1.15rem;font-family:var(--font-mono, monospace);margin-bottom:1.25rem;text-shadow:0 2px 8px rgba(0,0,0,0.8);position:relative;z-index:2">
          •••• •••• •••• ${c.last4}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:2">
          <div>
            <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.6)">Cardholder</div>
            <div style="font-size:0.88rem;font-weight:700;color:#fff;letter-spacing:0.04em;text-transform:uppercase">${c.cardholderName}</div>
          </div>
          <div>
            <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.6)">Expires</div>
            <div style="font-size:0.82rem;font-weight:700;color:#fff;font-family:var(--font-mono, monospace)">09/29</div>
          </div>
          <div style="text-align:right">
            ${isMastercard ? `
              <div style="display:flex;align-items:center">
                <div style="width:20px;height:20px;border-radius:50%;background:#ef4444;opacity:0.9"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#f59e0b;opacity:0.9;margin-left:-9px"></div>
              </div>
            ` : `
              <span style="font-size:1.15rem;font-weight:900;font-style:italic;color:#fff;letter-spacing:1px">VISA</span>
            `}
          </div>
        </div>

        <!-- Quick Card Controls Row -->
        <div style="display:flex;gap:0.4rem;margin-top:1.25rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.12);position:relative;z-index:2">
          <button class="btn btn-outline btn-sm" style="flex:1;padding:0.35rem 0.5rem;font-size:0.72rem;background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.2);color:#fff" onclick="toggleBlockCard('${c.id}', ${isBlocked})">
            ${isBlocked ? '🔓 Unlock Card' : '🔒 Lock Card'}
          </button>
          <button class="btn btn-outline btn-sm" style="flex:1;padding:0.35rem 0.5rem;font-size:0.72rem;background:rgba(0,0,0,0.5);border-color:rgba(255,255,255,0.2);color:#fff" onclick="promptChangePin('${c.id}')">
            🔑 Reset PIN
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (container) container.innerHTML = cardsHtml;
  if (containerTab) containerTab.innerHTML = cardsHtml;
}

// Issue Card
async function submitIssueCard(form) {
  try {
    const accountId = form.accountId.value;
    const payload = {
      type: form.type.value,
      network: form.network.value,
      cardholderName: form.cardholderName.value,
      limits: {
        daily: parseFloat(form.dailyLimit.value || 3000),
        monthly: parseFloat(form.monthlyLimit.value || 15000),
        atm: parseFloat(form.atmLimit.value || 1000)
      }
    };

    const res = await api(`/accounts/${accountId}/cards`, {
      method: 'POST',
      body: payload
    });

    // Auto-activate virtual card for smooth demo experience
    if (res.testModeActivationCode) {
      await api(`/cards/${res.id}/activate`, {
        method: 'POST',
        body: { activationCode: res.testModeActivationCode, pin: '1234' }
      });
      showToast(`Card issued and automatically activated with PIN 1234!`, 'success');
    }

    closeModal('modal-issue-card');
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

async function toggleBlockCard(cardId, isBlocked) {
  try {
    if (isBlocked) {
      await api(`/cards/${cardId}/unblock`, { method: 'POST' });
      showToast('Card unlocked.', 'info');
    } else {
      await api(`/cards/${cardId}/block`, {
        method: 'POST',
        body: { reason: 'TEMPORARY' }
      });
      showToast('Card locked temporarily.', 'info');
    }
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

function promptChangePin(cardId) {
  document.getElementById('pin-card-id').value = cardId;
  openModal('modal-change-pin');
}

async function submitChangePin(form) {
  try {
    const cardId = form.cardId.value;
    await api(`/cards/${cardId}/pin`, {
      method: 'POST',
      body: { oldPin: form.oldPin.value, newPin: form.newPin.value }
    });
    showToast('Card PIN updated successfully.', 'success');
    closeModal('modal-change-pin');
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- LOANS HUB
async function calculateLoanQuote(amount, termMonths, purpose) {
  try {
    const quote = await api('/loans/quotes', {
      method: 'POST',
      body: { amount: parseFloat(amount), termMonths: parseInt(termMonths), purpose, currency: 'USD' }
    });

    document.getElementById('loan-quote-apr').textContent = `${quote.apr}%`;
    document.getElementById('loan-quote-emi').textContent = `$${quote.monthlyPayment}/mo`;
    document.getElementById('loan-quote-total').textContent = `$${quote.totalRepayable}`;
    document.getElementById('loan-active-quote-id').value = quote.quoteId;
  } catch (err) {
    // Handled
  }
}

async function submitLoanApplication(form) {
  try {
    const quoteId = document.getElementById('loan-active-quote-id').value;
    if (!quoteId) {
      showToast('Please calculate a quote first.', 'error');
      return;
    }

    const payload = {
      quoteId: quoteId,
      disbursementAccountId: form.disbursementAccountId.value,
      employment: {
        status: form.employmentStatus.value,
        employer: form.employerName.value,
        annualIncome: parseFloat(form.annualIncome.value)
      },
      consentToCreditCheck: true
    };

    await api('/loans/applications', {
      method: 'POST',
      body: payload
    });

    showToast('Loan application submitted! Bank staff will review your application.', 'success');
    closeModal('modal-apply-loan');
    await loadLoansHub();
  } catch (err) {
    // Handled
  }
}

async function loadLoansHub() {
  try {
    const [apps, loans] = await Promise.all([
      api('/loans/applications'),
      api('/loans')
    ]);

    const appsContainer = document.getElementById('loan-applications-table');
    if (appsContainer) {
      if (apps.length === 0) {
        appsContainer.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:1.5rem">No submitted loan applications.</td></tr>`;
      } else {
        appsContainer.innerHTML = apps.map(a => `
          <tr>
            <td style="font-family:monospace">${a.id}</td>
            <td><span class="status-pill ${a.status.toLowerCase()}">${formatHumanText(a.status)}</span></td>
            <td>${a.status === 'REJECTED' ? `<span style="color:var(--rose-500)">${formatHumanText(a.reason) || ''}</span>` : 'Application pending review'}</td>
            <td>
              ${a.status === 'APPROVED' && a.loanId ? `
                <button class="btn btn-success btn-sm" onclick="disburseLoan('${a.loanId}')">Disburse Funds</button>
              ` : ''}
            </td>
          </tr>
        `).join('');
      }
    }

    const activeContainer = document.getElementById('active-loans-table');
    if (activeContainer) {
      if (loans.length === 0) {
        activeContainer.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:1.5rem">No active disbursed loans.</td></tr>`;
      } else {
        activeContainer.innerHTML = loans.map(l => `
          <tr>
            <td style="font-family:monospace">${l.id}</td>
            <td style="font-weight:700;color:var(--text-main)">$${l.principal.toLocaleString()}</td>
            <td>${l.apr}% APR</td>
            <td>$${l.monthlyPayment}/mo (${l.termMonths} mos)</td>
            <td>
              <button class="btn btn-outline btn-sm" onclick="viewLoanSchedule('${l.id}')">Repay</button>
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    // Handled
  }
}

async function disburseLoan(loanId) {
  try {
    const res = await api(`/loans/${loanId}/disburse`, { method: 'POST' });
    showToast(`Loan principal of $${res.principal} disbursed directly to your account!`, 'success');
    await loadCustomerDashboard();
    await loadLoansHub();
  } catch (err) {
    // Handled
  }
}

async function viewLoanSchedule(loanId) {
  try {
    const schedule = await api(`/loans/${loanId}/schedule`);
    const tbody = document.getElementById('loan-schedule-body');
    document.getElementById('loan-schedule-loan-id').textContent = loanId;

    if (tbody) {
      tbody.innerHTML = schedule.map(s => `
        <tr>
          <td>#${s.installmentNo}</td>
          <td>${s.dueDate}</td>
          <td style="font-weight:700;color:var(--text-main)">$${s.amount}</td>
          <td><span class="status-pill ${s.status.toLowerCase()}">${formatHumanText(s.status)}</span></td>
          <td>
            ${s.status === 'DUE' ? `
              <button class="btn btn-primary btn-sm" onclick="promptRepayInstallment('${loanId}', ${s.installmentNo}, ${s.amount})">Pay</button>
            ` : 'Paid'}
          </td>
        </tr>
      `).join('');
    }
    openModal('modal-loan-schedule');
  } catch (err) {
    // Handled
  }
}

async function promptRepayInstallment(loanId, installmentNo, amount) {
  if (customerAccounts.length === 0) {
    showToast('No active account available for repayment', 'error');
    return;
  }
  const fromAccountId = customerAccounts[0].id;
  try {
    await api(`/loans/${loanId}/repayments`, {
      method: 'POST',
      body: { installmentNo, fromAccountId }
    });
    showToast(`Installment #${installmentNo} repaid successfully!`, 'success');
    await viewLoanSchedule(loanId);
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- DISPUTES
function promptDispute(txId, amount) {
  document.getElementById('dispute-tx-id').value = txId;
  document.getElementById('dispute-amount').value = amount;
  openModal('modal-create-dispute');
}

async function submitDispute(form) {
  try {
    const txId = form.txId.value;
    const payload = {
      reason: form.reason.value,
      description: form.description.value,
      amountDisputed: parseFloat(form.amount.value)
    };

    await api(`/transactions/${txId}/disputes`, {
      method: 'POST',
      body: payload
    });

    showToast('Dispute case created! Bank staff will review the transaction.', 'info');
    closeModal('modal-create-dispute');
    closeModal('modal-transactions');
  } catch (err) {
    // Handled
  }
}

// ----------------------------------------------------------------- KYC SUBMIT
async function submitKycForm(form) {
  try {
    const payload = {
      documents: [
        {
          type: form.docType.value,
          number: form.docNumber.value,
          issuingCountry: form.country.value,
          expiryDate: form.expiryDate.value || undefined
        }
      ],
      employment: {
        status: form.empStatus.value,
        employer: form.employer.value,
        annualIncome: parseFloat(form.annualIncome.value || 0)
      },
      pepDeclaration: false,
      taxResidencies: [form.country.value]
    };

    await api('/kyc/applications', {
      method: 'POST',
      body: payload
    });

    showToast('KYC application submitted successfully for review!', 'success');
    closeModal('modal-submit-kyc');
    await loadCustomerDashboard();
  } catch (err) {
    // Handled
  }
}
