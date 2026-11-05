/**
 * NeoBank Application Tracking Engine
 * Dedicated module for existing application lookups, 3D state pipeline,
 * officer communications, and paper form inspection.
 */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var NAMES = {
    SAVINGS: 'High-yield savings',
    CHECKING: 'Current / checking',
    SALARY: 'Corporate salary',
    FIXED_DEPOSIT: 'Fixed / term deposit',
    MONEY_MARKET: 'Money market / recurring',
    PENSION: 'Pension savings',
    NRI_EXPAT: 'NRI / foreign expat',
    STUDENT: 'Student / youth',
    BSBDA: 'Basic savings (BSBDA)',
    OTHER: 'Other account'
  };

  var SP = {
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under review',
    VERIFIED: 'Verified',
    APPROVED: 'Approved',
    ACCOUNT_OPENED: 'Account opened',
    REJECTED: 'Rejected',
    DRAFT_INITIATED: 'Draft created',
    DRAFT_SAVED: 'Draft saved'
  };

  var STAGES = ['Submitted', 'Under review', 'Verified', 'Approved', 'Account issued'];
  var IDX = { SUBMITTED: 0, UNDER_REVIEW: 1, VERIFIED: 2, APPROVED: 3, ACCOUNT_OPENED: 4 };

  // Offline & Demo State Preview Records
  var DB = {
    '100001': { status: 'DRAFT_SAVED', isDraft: true, applicantName: 'Priya Nair', accountType: 'SAVINGS', branchName: 'Mumbai Main Branch', branchCode: 'BOM-001', updatedAt: '2026-11-02T09:15:00' },
    '100002': { status: 'SUBMITTED', applicantName: 'Rahul Mehta', accountType: 'CHECKING', branchName: 'Delhi Connaught Place Branch', branchCode: 'DEL-002', submittedAt: '2026-11-03T11:20:00' },
    '100003': { status: 'UNDER_REVIEW', applicantName: 'Anita Rao', accountType: 'FIXED_DEPOSIT', branchName: 'Bengaluru Tech Park Branch', branchCode: 'BLR-003', submittedAt: '2026-11-01T14:05:00', officerMessages: [{ senderName: 'Verifying Officer', timestamp: '2026-11-03T10:42:00', message: 'Please upload a clearer copy of your address proof. The last page was cut off.' }] },
    '100004': { status: 'VERIFIED', applicantName: 'Karan Shah', accountType: 'STUDENT', branchName: 'Pune Shivaji Nagar Branch', branchCode: 'PNQ-007', submittedAt: '2026-10-30T16:00:00', reviewedAt: '2026-11-02T12:30:00', reviewNotes: 'Documents verified. Waiting for final bank underwriting approval.' },
    '100005': { status: 'ACCOUNT_OPENED', applicantName: 'Meera Iyer', accountType: 'SAVINGS', branchName: 'Chennai Central Branch', branchCode: 'MAA-005', submittedAt: '2026-10-28T10:10:00', reviewedAt: '2026-10-30T15:45:00', generatedAccountNumber: '4821 0097 3306' },
    '100006': { status: 'REJECTED', applicantName: 'Dev Patel', accountType: 'PENSION', branchName: 'Ahmedabad Ashram Road Branch', branchCode: 'AMD-008', submittedAt: '2026-10-29T09:30:00', reviewedAt: '2026-10-31T13:00:00', reviewNotes: 'Age requirement or mandatory OVD document for this account type was not met.' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(m) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove('on'); }, 2600);
  }
  window.toast = toast;

  var d10 = function (s) { return s ? String(s).slice(0, 10) : ''; };

  /* Reference digit boxes */
  var rb = $('#refb');
  if (rb) {
    rb.innerHTML = [1, 2, 3, 4, 5, 6].map(function (n) {
      return '<input maxlength="1" inputmode="numeric" autocomplete="off" aria-label="Digit ' + n + '" data-testid="track-digit-' + n + '-input">';
    }).join('');
  }
  var bx = rb ? $$('input', rb) : [];

  function ref() {
    return bx.map(function (i) { return i.value; }).join('');
  }

  function setRef(v) {
    var clean = String(v || '').replace(/\D/g, '').slice(-6);
    bx.forEach(function (i, n) { i.value = clean[n] || ''; });
  }

  if (rb) {
    rb.addEventListener('input', function (e) {
      var t = e.target;
      t.value = t.value.replace(/\D/g, '').slice(-1);
      if (t.value) {
        t.classList.remove('pop');
        void t.offsetWidth;
        t.classList.add('pop');
        var n = t.nextElementSibling;
        if (n) n.focus();
      }
    });

    rb.addEventListener('keydown', function (e) {
      var t = e.target;
      if (e.key === 'Backspace' && !t.value && t.previousElementSibling) {
        t.previousElementSibling.value = '';
        t.previousElementSibling.focus();
      } else if (e.key === 'ArrowLeft' && t.previousElementSibling) {
        t.previousElementSibling.focus();
      } else if (e.key === 'ArrowRight' && t.nextElementSibling) {
        t.nextElementSibling.focus();
      }
    });

    rb.addEventListener('paste', function (e) {
      e.preventDefault();
      var raw = (e.clipboardData || window.clipboardData).getData('text') || '';
      var v = raw.replace(/\D/g, '').slice(-6);
      setRef(v);
      if (v.length === 6) look();
    });
  }

  var lookForm = $('#look');
  if (lookForm) {
    lookForm.addEventListener('submit', function (e) {
      e.preventDefault();
      look();
    });
  }

  var COL = [
    ['#7aa2ff', '122,162,255'],
    ['#ff9f43', '255,159,67'],
    ['#b78cff', '183,140,255'],
    ['#00f59b', '0,245,155'],
    ['#ffe27a', '255,226,122']
  ];
  var RED = ['#ff7a7a', '255,122,122'];
  var ICE = ['#e6eef8', '230,238,248'];

  var PC = {
    DRAFT_INITIATED: ICE,
    DRAFT_SAVED: ICE,
    SUBMITTED: COL[0],
    UNDER_REVIEW: COL[1],
    VERIFIED: COL[2],
    APPROVED: COL[3],
    ACCOUNT_OPENED: COL[4],
    REJECTED: RED
  };

  var WAIT = {
    SUBMITTED: ['We’ve received your application.', 'It’s currently queued for initial KYC and compliance check. We’ll update this page as each step is completed.'],
    UNDER_REVIEW: ['We’re checking your application.', 'Your identity and documents are being reviewed by a bank officer. We’ll update this page as each step is completed.'],
    VERIFIED: ['Your documents are verified.', 'Final account provisioning and allocation is next. We’ll update this page as soon as it’s complete.'],
    APPROVED: ['Your application is approved.', 'Your account is being provisioned in the core ledger. Your official account number will appear here shortly.']
  };

  function pcs(c) {
    return '--c:' + c[0] + ';--rgb:' + c[1];
  }

  /* Modal Helpers */
  window.openModal = function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.style.setProperty('z-index', '1000000', 'important');
      el.style.setProperty('display', 'flex', 'important');
      el.scrollTop = 0;
      requestAnimationFrame(function () { el.classList.add('active'); });
    }
  };

  window.closeModal = function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.remove('active');
      setTimeout(function () {
        if (!el.classList.contains('active')) {
          el.style.removeProperty('display');
          el.style.display = 'none';
        }
      }, 220);
    }
  };

  window.openTrackedBankForm = function () {
    var app = window.currentTrackedApp;
    if (!app) {
      toast('Please look up an application reference first.');
      return;
    }
    var numEl = document.getElementById('cust-modal-app-num');
    if (numEl) numEl.textContent = app.applicationNumber || 'APP-2026';
    var badgeEl = document.getElementById('cust-modal-status-badge');
    if (badgeEl) badgeEl.textContent = SP[app.status] || app.status || 'SUBMITTED';
    var nameEl = document.getElementById('cust-modal-applicant-name');
    if (nameEl) {
      nameEl.textContent = (app.applicantName || 'Applicant Draft') + ' • ' + (app.branchName || 'Central Branch') + ' • Uniform Application Dossier';
    }
    if (typeof window.renderBankApplicationPaperForm === 'function') {
      window.renderBankApplicationPaperForm(app, 'cust-bank-paper-container', 'cust_track');
    }
    window.openModal('modal-customer-bank-form');
  };

  /* Lookup Engine */
  async function look() {
    var v = ref(), f = $('#look');
    if (v.length < 6) {
      if (f) {
        f.classList.remove('shake');
        void f.offsetWidth;
        f.classList.add('shake');
      }
      toast('Enter all six digits of your reference number');
      if (bx[v.length]) bx[v.length].focus();
      return;
    }

    var fullNum = 'APP-2026-' + v;
    var out = $('#out');
    if (out) {
      out.hidden = false;
      out.innerHTML = '<div class="card nf" data-testid="track-loading-text"><div style="color:var(--mint);font-weight:600;margin-bottom:8px">Searching Core Banking Ledger…</div><p style="color:var(--ti);margin:0">Retrieving status and underwriting dossier for ' + esc(fullNum) + '</p></div>';
    }
    if (f) {
      f.classList.remove('scan');
      void f.offsetWidth;
      f.classList.add('scan');
    }

    var appData = null;

    // 1. Fetch from live API
    try {
      var res = await fetch('/onboarding/track/' + encodeURIComponent(fullNum));
      if (res.ok) {
        appData = await res.json();
      }
    } catch (_) {}

    // Check LocalStorage records
    var localApp = null;
    try {
      var apps = JSON.parse(localStorage.getItem('neobank_applications') || '{}');
      if (apps[fullNum]) localApp = apps[fullNum];
    } catch (_) {}

    // If local storage record exists and is SUBMITTED, prioritize SUBMITTED status over stale draft
    if (localApp && (localApp.status === 'SUBMITTED' || !localApp.isDraft)) {
      if (!appData || appData.status === 'DRAFT_SAVED' || appData.status === 'DRAFT_INITIATED') {
        appData = Object.assign({}, appData || {}, localApp, { status: 'SUBMITTED', isDraft: false });
      }
    }

    // 2. Fallback to LocalStorage if API did not return data
    if (!appData) {
      if (localApp) {
        appData = localApp;
      } else {
        try {
          var rawDraft = localStorage.getItem('nb_draft_' + fullNum);
          if (rawDraft) {
            var d = JSON.parse(rawDraft);
            appData = {
              applicationNumber: fullNum,
              status: 'DRAFT_SAVED',
              isDraft: true,
              accountType: d.acctType || 'SAVINGS',
              branchName: d.branchName || 'Mumbai Main Branch',
              branchCode: d.branchCode || 'BOM-001',
              applicantName: ((d.firstName || '') + ' ' + (d.lastName || '')).trim() || 'Applicant Draft',
              updatedAt: new Date().toISOString()
            };
          }
        } catch (_) {}
      }
    }

    // Ensure status consistency: if status is SUBMITTED or further along, isDraft is definitely false
    if (appData) {
      if (appData.status && appData.status !== 'DRAFT_SAVED' && appData.status !== 'DRAFT_INITIATED') {
        appData.isDraft = false;
      }
    }

    render(fullNum, appData);
    if (out) out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function render(no, a) {
    var out = $('#out');
    if (!out) return;
    window.currentTrackedApp = a;

    if (!a) {
      out.innerHTML = `
        <div class="card nf" data-testid="track-not-found">
          <div class="pill" style="display:inline-block;--c:var(--bad);--rgb:255,122,122">Reference Not Found</div>
          <h2>No application found.</h2>
          <p style="color:var(--ti);max-width:48ch;margin:auto">
            No core record matching “<b>${esc(no)}</b>” could be located. Please check the digits or start a new account.
          </p>
          <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
            <button class="ghost sm" type="button" onclick="document.querySelectorAll('#refb input')[0].focus()">Try Another Number</button>
            <a class="btn sm" href="/open_account_customer">Open New Account</a>
          </div>
        </div>
      `;
      return;
    }

    var st = a.status || 'SUBMITTED';
    var draft = !!a.isDraft || /^DRAFT/.test(st);
    var rej = st === 'REJECTED';
    var cur = IDX[st] !== undefined ? IDX[st] : 0;
    var pc = PC[st] || ICE;

    var applicantName = a.applicantName ||
      (a.applicant ? ((a.applicant.firstName || '') + ' ' + (a.applicant.lastName || '')).trim() : '') ||
      'Applicant Draft';

    var h = `
      <div class="card" data-testid="track-result-card">
        <div class="top2">
          <div class="no" data-testid="track-result-number">${esc(no)}</div>
          <span class="pill" style="${pcs(pc)}" data-testid="track-status-pill">${esc(SP[st] || st)}</span>
        </div>
        <div class="info">
          <div><small>Applicant</small><b>${esc(applicantName)}</b></div>
          <div><small>Account type</small><b>${esc(NAMES[a.accountType] || a.accountType || 'High-yield savings')}</b></div>
          <div><small>Branch</small><b>${esc(a.branchName || 'Mumbai Main Branch')}${a.branchCode ? ' (' + esc(a.branchCode) + ')' : ''}</b></div>
          <div><small>${draft ? 'Saved' : 'Submitted'}</small><b>${esc(d10(a.updatedAt || a.submittedAt || a.createdAt) || 'Recent')}</b></div>
        </div>
      </div>
    `;

    // 3D Pipeline
    if (!draft) {
      var lis = STAGES.map(function (s, k) {
        var bad = rej && k === 2;
        var c = bad ? RED : COL[k];
        var nx = (rej && k === 1) ? RED : (COL[k + 1] || c);
        var state = bad ? 'bad' : rej ? (k < 2 ? 'done' : '') : (k < cur || (k === cur && k === 4)) ? 'done' : (k === cur ? 'cur' : '');
        var lk = rej ? k < 2 : k < cur;
        var date = k === 0 ? d10(a.submittedAt || a.createdAt) : ((k === 2 && a.reviewedAt) ? d10(a.reviewedAt) : '');

        return `
          <li data-s="${state}" ${lk ? 'data-lk="1"' : ''} style="--i:${k};${pcs(c)};--cn:${nx[0]}" data-testid="track-stage-${k + 1}">
            <div class="node">
              <svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>
              <b>${bad ? '✕' : k + 1}</b>
            </div>
            <div>${bad ? 'Rejected' : s}${date ? '<small>' + date + '</small>' : ''}</div>
          </li>
        `;
      }).join('');

      h += `
        <div class="card">
          <div class="pipe" data-testid="track-pipeline">
            <ol>${lis}</ol>
          </div>
        </div>
      `;
    }

    // Status Panels
    if (draft) {
      h += `
        <div class="panel draft" data-testid="track-draft-panel">
          <h3>${st === 'DRAFT_SAVED' ? 'Your draft is saved.' : 'Your application is started.'}</h3>
          <p>${st === 'DRAFT_SAVED' ? 'Your entered details are secured in our core system. Resume anytime to complete and submit your application.' : 'Your unique reference number is locked. Complete the uniform form to submit your application.'}</p>
          <a class="btn" href="/open_account_customer/${encodeURIComponent(no)}" data-testid="track-resume-button">Continue your application</a>
        </div>
      `;
    } else if (st === 'ACCOUNT_OPENED') {
      h += `
        <div class="acctc" data-testid="track-account-panel">
          <div class="face">
            <small>Your official account number</small>
            <b data-testid="track-account-number">${esc(a.generatedAccountNumber || '4821 0097 3306')}</b>
            <small>Your account is active. You can now sign in to digital banking.</small>
            <p style="margin:1.2rem 0 0">
              <a class="btn" href="/login" data-testid="track-signin-button">Sign in to your dashboard</a>
            </p>
          </div>
        </div>
      `;
    } else if (rej) {
      h += `
        <div class="panel rej" data-testid="track-rejected-panel">
          <h3>This application was not approved.</h3>
          <p>${esc(a.reviewNotes || 'It does not meet current eligibility or documentation standards.')}</p>
          <a class="ghost" href="/open_account_customer" data-testid="track-apply-again-link">Start a new application</a>
        </div>
      `;
    } else {
      var w = WAIT[st] || WAIT.UNDER_REVIEW;
      h += `
        <div class="panel wait" style="${pcs(pc)}" data-testid="track-review-panel">
          <h3>${w[0]}</h3>
          <p>${w[1]}</p>
        </div>
      `;
    }

    // Officer Notes
    if (!draft && a.reviewNotes && !rej) {
      h += `
        <div class="panel" data-testid="track-notes-panel">
          <h3>Officer notes</h3>
          <p style="margin:0">${esc(a.reviewNotes)}</p>
        </div>
      `;
    }

    // Verifying Officer Messages & Reply
    var ms = a.officerMessages || [];
    if (!draft && ms.length) {
      h += `
        <div class="card" data-testid="track-messages-card">
          <b style="font:700 1.2rem Syne,sans-serif">Messages from your verifying officer</b>
          <div class="msgs" id="msgs">
            ${ms.map(function (m) {
              return `
                <div class="msg">
                  <header>
                    <span>${esc(m.senderName || 'Verifying officer')}</span>
                    <span>${esc((m.timestamp || '').slice(0, 16).replace('T', ' '))}</span>
                  </header>
                  ${esc(m.message)}
                </div>
              `;
            }).join('')}
          </div>
          <div class="reply">
            <textarea id="rt" placeholder="Write a reply or provide document clarifications to the officer…" aria-label="Reply to the officer" data-testid="track-reply-textarea"></textarea>
            <div>
              <button class="ghost sm" id="rs" type="button" data-testid="track-reply-send-button">Send reply</button>
            </div>
          </div>
        </div>
      `;
    }

    // Official Application Form (4 Pages) Card
    h += `
      <div class="card">
        <div class="formrow">
          <div>
            <b>Official uniform application form</b>
            <span>4 pages, exactly as you submitted it (CIF, KYC, Account, Declarations).</span>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn sm" id="vf" type="button" data-testid="track-view-form-button">View 3D preview</button>
            <button class="ghost sm" id="vfull" type="button" onclick="openTrackedBankForm()">Printable dossier</button>
            <button class="ghost sm" id="df" type="button" data-testid="track-download-form-button" onclick="window.printBankApplicationForm('cust_track')">Download PDF</button>
          </div>
        </div>
      </div>
    `;

    // Uploaded Documents Vault
    if (a.documents && a.documents.length) {
      h += `
        <div class="card" data-testid="track-docs-card">
          <div class="formrow" style="margin-bottom:14px">
            <div>
              <b>Encrypted Verification Documents</b>
              <span>AES-256 encrypted in SQL vault. Decrypted on demand.</span>
            </div>
          </div>
          <div style="display:grid;gap:10px">
            ${a.documents.map(function (d) {
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.03);padding:12px 16px;border-radius:14px;border:1px solid var(--line);flex-wrap:wrap;gap:10px">
                  <div>
                    <b style="font-size:.95rem">${esc(d.name || d.docType || 'Document')}</b>
                    <small style="display:block;color:var(--ti);font-size:.8rem">
                      ${esc(d.docCategory || 'IDENTITY')} • ${d.size ? (d.size / 1024).toFixed(1) + ' KB' : 'Encrypted BLOB'} • AES-256
                    </small>
                  </div>
                  <div style="display:flex;gap:8px">
                    <button type="button" class="ghost sm" onclick="window.viewDecryptedDocument('${esc(d.id)}', '${esc(d.name || 'Document')}', '${esc(d.fileMime || 'application/octet-stream')}')">View</button>
                    <button type="button" class="btn sm" onclick="window.downloadDecryptedDocument('${esc(d.id)}', '${esc(d.name || 'Document')}')">Download</button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    out.innerHTML = h;

    // Animate pipeline nodes and tracks
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $$('.pipe li', out).forEach(function (li) {
          if (li.dataset.s) li.classList.add(li.dataset.s);
          if (li.dataset.lk) li.classList.add('lk');
        });
      });
    });

    // Officer reply action
    var rs = $('#rs');
    if (rs) {
      rs.onclick = async function () {
        var t = $('#rt');
        var textVal = t.value.trim();
        if (!textVal) {
          toast('Write a message first');
          return;
        }
        var m = document.createElement('div');
        m.className = 'msg me';
        m.innerHTML = '<header><span>You</span><span>just now</span></header>' + esc(textVal);
        var msgsEl = $('#msgs');
        if (msgsEl) msgsEl.appendChild(m);
        t.value = '';
        toast('Reply sent to verifying officer');
      };
    }

    // View Form actions
    var vf = $('#vf');
    if (vf) vf.onclick = function () {
      var fanEl = $('#fan');
      if (fanEl) fanEl.hidden = false;
    };
  }

  // Populate Fan Viewer Tiles
  var frEl = $('#fr');
  if (frEl) {
    frEl.innerHTML = ['CIF & CKYC', 'KYC & OVD', 'Account form', 'Declarations'].map(function (t, k) {
      return '<div class="tile" style="--i:' + k + '" onclick="openTrackedBankForm()"><div><b>' + (k + 1) + '</b><br><span>' + t + '</span></div><small style="color:var(--mint);font-size:.78rem;font-weight:600">Click to view page ➔</small></div>';
    }).join('');
  }

  var fanx = $('#fanx');
  if (fanx) {
    fanx.onclick = function () {
      var fanEl = $('#fan');
      if (fanEl) fanEl.hidden = true;
    };
  }

  /* 3D Tilt on Lookup Card */
  var lk = $('#look');
  if (!reduce && matchMedia('(hover:hover)').matches && lk) {
    lk.addEventListener('pointermove', function (e) {
      var r = lk.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5;
      var y = (e.clientY - r.top) / r.height - .5;
      lk.style.transform = 'perspective(900px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
    });
    lk.addEventListener('pointerleave', function () {
      lk.style.transform = '';
    });
  }

  /* Currents Background Canvas */
  if (!reduce) {
    var fxCanvas = $('#fx');
    if (fxCanvas) {
      var c = fxCanvas.getContext('2d'), P = [], mx = -999, my = -999, W, H;
      function sp(p) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.s = .6 + Math.random() * 1.1;
        p.h = Math.random() < .2;
        return p;
      }
      function isLightTheme() {
        return document.documentElement.getAttribute('data-theme') === 'light' ||
               document.body.classList.contains('light-theme');
      }

      function sz() {
        var d = Math.min(devicePixelRatio || 1, 2);
        W = innerWidth;
        H = innerHeight;
        fxCanvas.width = W * d;
        fxCanvas.height = H * d;
        c.setTransform(d, 0, 0, d, 0, 0);
        c.fillStyle = isLightTheme() ? '#f5f8fc' : '#04060b';
        c.fillRect(0, 0, W, H);
        P = [];
        for (var i = 0; i < (W < 700 ? 40 : 90); i++) P.push(sp({}));
      }

      window.addEventListener('neobank:themechange', function () {
        sz();
      });
      addEventListener('resize', sz);
      sz();
      addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
      (function f(t) {
        requestAnimationFrame(f);
        if (document.hidden) return;
        var light = isLightTheme();
        c.fillStyle = light ? 'rgba(245, 248, 252, 0.08)' : 'rgba(4, 6, 11, .09)';
        c.fillRect(0, 0, W, H);
        P.forEach(function (p) {
          var a = Math.sin(p.x * .0028 + t * .00016) * 2.4 + Math.cos(p.y * .0035 - t * .00013) * 2.4;
          var d = Math.hypot(mx - p.x, my - p.y);
          if (d < 160) a += (1 - d / 160) * 2.2;
          var ox = p.x, oy = p.y;
          p.x += Math.cos(a) * p.s * 1.2;
          p.y += Math.sin(a) * p.s * 1.2;
          if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) { sp(p); return; }
          c.strokeStyle = p.h ? 'rgba(0, 245, 155, .4)' : 'rgba(190, 215, 255, .12)';
          c.beginPath();
          c.moveTo(ox, oy);
          c.lineTo(p.x, p.y);
          c.stroke();
        });
      })(0);
    }
  }

  /* Auto-Detect and Track from URL */
  function detectAndTrackFromUrl() {
    var appNum = '';
    var path = window.location.pathname;
    var pathMatch = path.match(/\/(?:existing_application|track)\/([^\/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      var raw = decodeURIComponent(pathMatch[1]).trim();
      raw = raw.replace(/^app=/i, '').replace(/^id=/i, '').replace(/^application=/i, '');
      if (raw) appNum = raw;
    }

    if (!appNum) {
      var params = new URLSearchParams(window.location.search);
      var paramVal = params.get('app') || params.get('applicationNumber') || params.get('id') || params.get('ref') || params.get('appNumber');
      if (paramVal) {
        appNum = paramVal.trim().replace(/^app=/i, '');
      }
    }

    if (!appNum) {
      try {
        var lastApp = localStorage.getItem('neobank_last_submitted_app');
        if (lastApp) appNum = lastApp;
      } catch (_) {}
    }

    if (appNum) {
      var digits = appNum.replace(/\D/g, '').slice(-6);
      if (digits) {
        setRef(digits);
        look();
      }
    }
  }

  document.addEventListener('DOMContentLoaded', detectAndTrackFromUrl);
})();

