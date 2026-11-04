/**
 * NeoBank Open Account Start Page & Kinetic Onboarding Engine
 * Handles hero scroll storytelling, category accordion with clean account cards,
 * dynamic requirements & documents panel (#needStep), autotype branch search
 * with words pagination (One -> Six), eligibility confirmation, and cinematic
 * typewriter application reference generation.
 */

(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  // Central Application State for Step 1
  var st = {
    type: '',
    label: '',
    name: '',
    code: ''
  };

  // 24 Available Servicing Branches
  var BRANCHES = [
    { name: 'Downtown Main Branch', code: 'BR001', city: 'Metropolitan Core' },
    { name: 'Central Digital Branch', code: 'NBK-001', city: 'Online / Global Virtual' },
    { name: 'Mumbai Main Branch', code: 'BOM-001', city: 'Mumbai, Maharashtra' },
    { name: 'Delhi Connaught Place Branch', code: 'DEL-002', city: 'New Delhi' },
    { name: 'Bengaluru Tech Park Branch', code: 'BLR-003', city: 'Bengaluru, Karnataka' },
    { name: 'Hyderabad Cyber City Branch', code: 'HYD-004', city: 'Hyderabad, Telangana' },
    { name: 'Chennai Central Branch', code: 'MAA-005', city: 'Chennai, Tamil Nadu' },
    { name: 'Kolkata Park Street Branch', code: 'CCU-006', city: 'Kolkata, West Bengal' },
    { name: 'Pune Shivaji Nagar Branch', code: 'PNQ-007', city: 'Pune, Maharashtra' },
    { name: 'Ahmedabad Ashram Road Branch', code: 'AMD-008', city: 'Ahmedabad, Gujarat' },
    { name: 'Jaipur Pink City Branch', code: 'JAI-009', city: 'Jaipur, Rajasthan' },
    { name: 'Kochi Marine Drive Branch', code: 'COK-010', city: 'Kochi, Kerala' },
    { name: 'Chandigarh Sector 17 Branch', code: 'IXC-011', city: 'Chandigarh' },
    { name: 'Lucknow Hazratganj Branch', code: 'LKO-012', city: 'Lucknow, Uttar Pradesh' },
    { name: 'Surat Diamond Bourse Branch', code: 'STV-013', city: 'Surat, Gujarat' },
    { name: 'Indore Vijay Nagar Branch', code: 'IDR-014', city: 'Indore, Madhya Pradesh' },
    { name: 'Goa Panaji Coastal Branch', code: 'GOI-015', city: 'Panaji, Goa' },
    { name: 'Nagpur Zero Mile Branch', code: 'NAG-016', city: 'Nagpur, Maharashtra' },
    { name: 'Bhubaneswar Temple City Branch', code: 'BBI-017', city: 'Bhubaneswar, Odisha' },
    { name: 'Coimbatore Avinashi Road Branch', code: 'CJB-018', city: 'Coimbatore, Tamil Nadu' },
    { name: 'Visakhapatnam Beach Road Branch', code: 'VTZ-019', city: 'Visakhapatnam, Andhra Pradesh' },
    { name: 'Bhopal MP Nagar Branch', code: 'BHO-020', city: 'Bhopal, Madhya Pradesh' },
    { name: 'Patna Fraser Road Branch', code: 'PAT-021', city: 'Patna, Bihar' },
    { name: 'London International Desk', code: 'LON-022', city: 'London, United Kingdom' }
  ];

  var NUMBER_WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  var PAGE_WORDS_CACHE = {};

  function getPageWord(idx, cb) {
    var pageNum = idx + 1;
    if (PAGE_WORDS_CACHE[pageNum]) {
      if (cb) cb(PAGE_WORDS_CACHE[pageNum]);
      return PAGE_WORDS_CACHE[pageNum];
    }
    if (NUMBER_WORDS[idx]) {
      PAGE_WORDS_CACHE[pageNum] = NUMBER_WORDS[idx];
      if (cb) cb(NUMBER_WORDS[idx]);
      return NUMBER_WORDS[idx];
    }
    fetch('/onboarding/num2words?number=' + encodeURIComponent(pageNum) + '&mode=page')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.words) {
          PAGE_WORDS_CACHE[pageNum] = d.words;
          if (cb) cb(d.words);
        }
      })
      .catch(function () {});
    return 'Page ' + pageNum;
  }
  var PAGE_SIZE = 4; // 4 branches per page for 2x2 grid -> 24 branches = 6 pages (One -> Six)
  var currentBranchPage = 0;
  var branchSearchFilter = '';

  // Prerequisites & Demanded Documents Dictionary (No APY displayed)
  var D = {
    "SAVINGS": {
      "apy": "4.20% APY",
      "tag": "Daily Interest",
      "chips": [["Min Deposit", "₹ 1,000.00"], ["Age", "18+"], ["Fee", "₹0/mo"]],
      "reqs": ["Must be at least 18 years old", "Initial deposit of at least ₹ 1,000.00 upon approval", "Legal resident of supported jurisdiction"],
      "docs": [["Proof of Identity", "Passport or Driver's License"], ["Proof of Address", "Utility bill (< 3 months old)"], ["Tax ID", "SSN or PAN card"]]
    },
    "CHECKING": {
      "apy": "0.10% APY",
      "tag": "High Liquidity",
      "chips": [["Min Deposit", "₹ 500.00"], ["Age", "18+"], ["Fee", "₹0/mo"]],
      "reqs": ["Must be at least 18 years old", "Zero daily minimum balance requirement", "Overdraft protection available on credit approval"],
      "docs": [["Proof of Identity", "Passport or Driver's License"], ["Proof of Address", "Utility bill or Council Tax statement"], ["Tax ID", "SSN, PAN, or National Tax ID"]]
    },
    "SALARY": {
      "apy": "2.50% APY",
      "tag": "Payroll Growth",
      "chips": [["Min Deposit", "₹ 0.00"], ["Age", "18+"], ["Fee", "₹0/mo"]],
      "reqs": ["Must be actively employed or corporate professional", "Zero minimum balance requirement", "Recurring monthly payroll credit required"],
      "docs": [["Proof of Identity", "Passport or National ID"], ["Employment Proof", "Salary payslip, Offer letter, or Corporate ID"], ["Tax ID", "SSN or Tax Identification"]]
    },
    "FIXED_DEPOSIT": {
      "apy": "5.25% APY",
      "tag": "Guaranteed Lock-In",
      "chips": [["Min Deposit", "₹ 10,000.00"], ["Age", "18+"], ["Fee", "₹0/mo"]],
      "reqs": ["Must be at least 18 years old", "Minimum initial principal lock-in of ₹ 10,000.00", "Guaranteed penalty-free interest compounding at maturity"],
      "docs": [["Proof of Identity", "Passport, National ID, or Driver's License"], ["Proof of Address", "Recent Utility Bill or Tax Document"], ["Source of Funds", "Bank statement verifying deposit origin"]]
    },
    "MONEY_MARKET": {
      "apy": "3.80% APY",
      "tag": "Tiered Growth",
      "chips": [["Min Deposit", "₹ 5,000.00"], ["Age", "18+"], ["Fee", "₹0/mo"]],
      "reqs": ["Must be at least 18 years old", "Minimum initial deposit of ₹ 5,000.00 with recurring schedule", "Flexible liquidity with limited monthly withdrawals"],
      "docs": [["Proof of Identity", "Passport or National ID Card"], ["Proof of Address", "Utility bill or bank statement"], ["Tax ID", "SSN or Government Tax ID"]]
    },
    "NRI_EXPAT": {
      "apy": "3.50% APY",
      "tag": "Cross-Border FX",
      "chips": [["Min Deposit", "₹ 5,000.00 (or $100 FX)"], ["Age", "18+"], ["Fee", "₹0/mo"]],
      "reqs": ["Expatriate, non-resident citizen, or global remote worker", "Zero conversion fee on cross-border inward remittances", "Instant access to multi-currency sub-ledgers"],
      "docs": [["Passport & Visa", "Foreign work visa or resident permit"], ["Overseas Address", "Utility bill or host country lease"], ["Tax Residency Declaration", "W-8BEN or CRS self-certification"]]
    },
    "STUDENT": {
      "apy": "1.75% APY",
      "tag": "Zero Maintenance",
      "chips": [["Min Deposit", "₹ 0.00"], ["Age", "16 - 26"], ["Fee", "₹0/mo"]],
      "reqs": ["Age strictly between 16 and 26 years", "Enrolled in accredited high school, college, or university", "Zero maintenance fees and complimentary student digital card"],
      "docs": [["Proof of Identity", "Passport or National ID"], ["Student Proof", "Student ID card or University Acceptance Letter"], ["Proof of Address", "Dormitory registration or guardian utility bill"]]
    },
    "PENSION": {
      "apy": "4.50% APY",
      "tag": "Senior & Disability",
      "chips": [["Min Deposit", "₹ 0.00"], ["Age", "60+ (or 18+ Disability)"], ["Fee", "₹0/mo"]],
      "reqs": ["Senior Citizens (60+ years) OR Disability Pension Beneficiaries (18+)", "Direct Treasury, Central/State Govt, EPS, or Armed Forces PPO credit", "Zero minimum balance requirement & free doorstep banking for 70+ / disabled"],
      "docs": [["Proof of Identity & Age", "Aadhaar Card, Passport, or Voter ID"], ["PPO / Disability Cert", "Pension Payment Order or Disability UDID Card"], ["Proof of Address", "Aadhaar, Utility bill, or Govt allotment letter"]]
    }
  };

  /* ==========================================================================
     1. FLOWING AMBIENT PARTICLES CANVAS (#fx)
     ========================================================================== */
  var cv = $('#fx');
  if (cv) {
    var c = cv.getContext('2d');
    var P = [];
    var mx = -999, my = -999;

    function isLightTheme() {
      return document.documentElement.getAttribute('data-theme') === 'light' ||
        document.body.classList.contains('light-theme');
    }

    function spawn(p) {
      p.x = Math.random() * window.innerWidth;
      p.y = Math.random() * window.innerHeight;
      p.s = 0.6 + Math.random() * 1.2;
      p.h = Math.random() < 0.25;
      return p;
    }

    function size() {
      var d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = window.innerWidth * d;
      cv.height = window.innerHeight * d;
      c.setTransform(d, 0, 0, d, 0, 0);
      c.fillStyle = isLightTheme() ? '#f5f8fc' : '#04060b';
      c.fillRect(0, 0, window.innerWidth, window.innerHeight);
      P = [];
      var count = window.innerWidth < 700 ? 60 : 130;
      for (var i = 0; i < count; i++) {
        P.push(spawn({}));
      }
    }

    window.addEventListener('resize', size);
    window.addEventListener('neobank:themechange', size);
    size();

    window.addEventListener('pointermove', function (e) {
      mx = e.clientX;
      my = e.clientY;
    }, { passive: true });

    function fxFrame(t) {
      if (!reduce && !document.hidden) {
        var light = isLightTheme();
        c.fillStyle = light ? 'rgba(245, 248, 252, 0.08)' : 'rgba(4, 6, 11, 0.07)';
        c.fillRect(0, 0, window.innerWidth, window.innerHeight);
        c.lineWidth = 1.1;

        for (var i = 0; i < P.length; i++) {
          var p = P[i];
          var a = Math.sin(p.x * 0.0028 + t * 0.00018) * 2.4 +
            Math.cos(p.y * 0.0035 - t * 0.00014) * 2.4;
          var d = Math.hypot(mx - p.x, my - p.y);
          if (d < 180) {
            a += (1 - d / 180) * 2.5;
          }
          var ox = p.x;
          var oy = p.y;
          p.x += Math.cos(a) * p.s * 1.4;
          p.y += Math.sin(a) * p.s * 1.4;

          if (p.x < 0 || p.y < 0 || p.x > window.innerWidth || p.y > window.innerHeight) {
            spawn(p);
            continue;
          }

          if (light) {
            c.strokeStyle = p.h ? 'rgba(0, 200, 120, 0.6)' : 'rgba(71, 85, 105, 0.22)';
          } else {
            c.strokeStyle = p.h ? 'rgba(0, 245, 155, 0.6)' : 'rgba(190, 215, 255, 0.22)';
          }

          c.beginPath();
          c.moveTo(ox, oy);
          c.lineTo(p.x, p.y);
          c.stroke();
        }
      }
      if (!reduce) requestAnimationFrame(fxFrame);
    }
    if (!reduce) requestAnimationFrame(fxFrame);
  }

  /* ==========================================================================
     2. PINNED SCROLL STORYTELLING STAGE (#stage)
     ========================================================================== */
  var stage = $('#stage');
  if (stage) {
    var pin = stage.querySelector('.pin');
    var chaps = stage.querySelectorAll('.chap');
    var panes = stage.querySelectorAll('.pane');
    var steps = stage.querySelectorAll('.pane .steps div');
    var cur = -1;

    function stageUpdate() {
      var r = stage.getBoundingClientRect();
      var maxScroll = r.height - window.innerHeight;
      var p = maxScroll > 0 ? Math.min(Math.max(-r.top / maxScroll, 0), 1) : 0;
      var n = panes.length;
      var i = Math.min(n - 1, Math.floor(p * n));

      if (pin) pin.style.setProperty('--p', p);

      panes.forEach(function (el, k) {
        el.style.setProperty('--q', k < i ? 1 : k > i ? 0 : Math.min(Math.max(p * n - i, 0), 1));
      });

      var q = Math.min(Math.max(p * n - i, 0), 1);
      steps.forEach(function (el) {
        el.classList.toggle('lit', i === n - 1 && q > +el.dataset.t);
      });

      if (i !== cur) {
        cur = i;
        chaps.forEach(function (el, k) {
          el.classList.toggle('on', k === i);
          el.setAttribute('aria-hidden', k !== i);
        });
        panes.forEach(function (el, k) {
          el.classList.toggle('on', k === i);
        });
      }
    }

    window.addEventListener('scroll', stageUpdate, { passive: true });
    document.addEventListener('scroll', stageUpdate, { passive: true });
    window.addEventListener('resize', stageUpdate);
    stageUpdate();
  }

  /* ==========================================================================
     3. INTERACTIVE CATEGORY ACCORDION & ACCOUNT CARDS
     ========================================================================== */
  var bs = $('#branchStep');
  var es = $('#eligStep');
  var el = $('#elig');
  var go = $('#go');
  var sum = $('#sum');

  function lock(e, on) {
    if (!e) return;
    e.classList.toggle('locked', on);
    if (on) e.setAttribute('inert', '');
    else e.removeAttribute('inert');
  }

  function look(e) {
    if (!e) return;
    e.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }

  function update() {
    if (!go || !sum) return;
    var ready = !!(st.type && st.code && el && el.checked);
    go.disabled = !ready;

    if (!st.type) {
      sum.textContent = 'Choose an account to begin.';
    } else if (!st.code) {
      sum.textContent = st.label + '. Now choose your home branch.';
    } else if (!el || !el.checked) {
      sum.textContent = st.label + ' at ' + st.name + '. Confirm your eligibility to continue.';
    } else {
      sum.textContent = st.label + ' at ' + st.name + '. Ready when you are.';
    }
  }

  // Render Dynamic Requirements Panel (#needStep)
  function need(type) {
    var d = D[type];
    var p = $('#needStep');
    if (!d || !p) return;

    var title = $('#needTitle');
    if (title) title.textContent = 'What you’ll need for ' + st.label;

    var f = $('#needFacts');
    if (f) {
      f.innerHTML = '';
      d.chips.forEach(function (c) {
        var x = document.createElement('div');
        var sm = document.createElement('small');
        sm.textContent = c[0];
        var b = document.createElement('b');
        b.textContent = c[1];
        x.appendChild(sm);
        x.appendChild(b);
        x.setAttribute('data-testid', 'start-fact-' + c[0].toLowerCase().replace(/\s+/g, '-'));
        f.appendChild(x);
      });
      if (d.apy) {
        var r = document.createElement('div');
        var sm = document.createElement('small');
        sm.textContent = 'Rate';
        var b = document.createElement('b');
        b.textContent = d.apy;
        r.appendChild(sm);
        r.appendChild(b);
        r.setAttribute('data-testid', 'start-fact-rate');
        f.appendChild(r);
      }
    }

    var u = $('#needReqs');
    if (u) {
      u.innerHTML = '';
      d.reqs.forEach(function (t, i) {
        var l = document.createElement('li');
        l.textContent = t;
        l.style.setProperty('--n', i);
        l.setAttribute('data-testid', 'start-requirement-' + (i + 1));
        u.appendChild(l);
      });
    }

    var o = $('#needDocs');
    if (o) {
      o.innerHTML = '';
      d.docs.forEach(function (t, i) {
        var l = document.createElement('li');
        l.style.setProperty('--n', i + 3);
        if (t[0]) {
          var b = document.createElement('b');
          b.textContent = t[0] + ': ';
          l.appendChild(b);
        }
        l.appendChild(document.createTextNode(t[1]));
        l.setAttribute('data-testid', 'start-document-' + (i + 1));
        o.appendChild(l);
      });
    }

    p.hidden = false;
    p.style.animation = 'none';
    void p.offsetWidth;
    p.style.animation = '';
  }

  function mk(t, c, x) {
    var e = document.createElement(t);
    if (c) e.className = c;
    if (x != null) e.textContent = x;
    return e;
  }

  // Populate APY badges and meta chips on all Step 1 Account buttons (matches open-account-start.html)
  $$('.acct').forEach(function (b) {
    var d = D[b.dataset.type];
    if (!d) return;
    if (!b.querySelector('.apy') && d.apy) {
      var a = mk('div', 'apy');
      a.appendChild(mk('em', '', d.apy));
      a.appendChild(mk('small', '', d.tag || ''));
      b.insertBefore(a, b.firstChild);
    }
    if (!b.querySelector('.meta') && d.chips) {
      var m = mk('div', 'meta');
      d.chips.forEach(function (c) {
        m.appendChild(mk('i', '', c[0] + ' ' + c[1]));
      });
      b.appendChild(m);
    }
  });

  // Category Accordion Toggling
  $$('.cat-h').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.parentNode;
      var isOpen = !cat.classList.contains('open');

      $$('.cat').forEach(function (x) {
        x.classList.remove('open');
        var h = x.querySelector('.cat-h');
        if (h) h.setAttribute('aria-expanded', 'false');
      });

      if (isOpen) {
        cat.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Account Card Selection
  $$('.acct').forEach(function (card) {
    card.addEventListener('click', function () {
      $$('.acct').forEach(function (x) {
        x.setAttribute('aria-pressed', 'false');
        x.classList.remove('selected');
      });
      card.setAttribute('aria-pressed', 'true');
      card.classList.add('selected');

      $$('.cat').forEach(function (c) {
        c.classList.toggle('has', c.contains(card));
      });

      var first = !st.type;
      st.type = card.dataset.type || '';
      st.label = card.dataset.label || '';

      need(st.type);
      lock(bs, false);
      update();

      var hiddenType = document.getElementById('apply-selected-account-type');
      if (hiddenType) hiddenType.value = st.type;

      setTimeout(function () {
        look($('#needStep'));
      }, 250);
    });
  });

  /* ==========================================================================
     4. BRANCH SELECTION WITH SEARCH & WORDS PAGINATION (One -> Six)
     ========================================================================== */
  function getFilteredBranches() {
    var query = (branchSearchFilter || '').trim().toLowerCase();
    if (!query) return BRANCHES;
    return BRANCHES.filter(function (b) {
      return b.name.toLowerCase().indexOf(query) !== -1 ||
        b.code.toLowerCase().indexOf(query) !== -1 ||
        b.city.toLowerCase().indexOf(query) !== -1;
    });
  }

  function selectBranch(name, code) {
    st.name = name;
    st.code = code;

    $$('.br').forEach(function (x) {
      var matched = (x.dataset.code === code);
      x.setAttribute('aria-pressed', matched ? 'true' : 'false');
      x.classList.toggle('selected', matched);
    });

    var selectedTag = $('#branch-selected-tag');
    if (selectedTag) {
      selectedTag.innerHTML = '<strong>' + name + '</strong> <span class="tag-code">' + code + '</span>';
      selectedTag.style.display = 'inline-flex';
    }

    var s1Select = document.getElementById('step1-branch-select');
    var s1Code = document.getElementById('step1-branch-code');
    if (s1Select) s1Select.value = name;
    if (s1Code) s1Code.value = code;

    lock(es, false);
    update();

    setTimeout(function () {
      look(es);
    }, 250);
  }

  function renderBranchPage() {
    var filtered = getFilteredBranches();
    var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentBranchPage >= totalPages) currentBranchPage = totalPages - 1;
    if (currentBranchPage < 0) currentBranchPage = 0;

    var startIdx = currentBranchPage * PAGE_SIZE;
    var pageBranches = filtered.slice(startIdx, startIdx + PAGE_SIZE);

    var container = $('#branchGrid');
    if (!container) return;
    container.innerHTML = '';

    if (pageBranches.length === 0) {
      container.innerHTML = '<div class="branch-no-results">No branches match "' + branchSearchFilter + '"</div>';
    } else {
      pageBranches.forEach(function (b) {
        var isSel = (b.code === st.code);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'br' + (isSel ? ' selected' : '');
        btn.setAttribute('aria-pressed', isSel ? 'true' : 'false');
        btn.setAttribute('data-name', b.name);
        btn.setAttribute('data-code', b.code);
        btn.setAttribute('data-testid', 'start-branch-' + b.code.toLowerCase() + '-button');

        var bold = document.createElement('b');
        bold.textContent = b.name;
        var sp = document.createElement('span');
        sp.textContent = b.code + ' • ' + b.city;

        btn.appendChild(bold);
        btn.appendChild(sp);

        btn.addEventListener('click', function () {
          selectBranch(b.name, b.code);
        });

        container.appendChild(btn);
      });
    }

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    var paginationWrap = $('#branchPagination');
    var wordsWrap = $('#branchPageWords');
    var indicator = $('#branchPageWordIndicator');
    var prevBtn = $('#prevBranchPage');
    var nextBtn = $('#nextBranchPage');

    if (!paginationWrap || !wordsWrap) return;

    if (totalPages <= 1) {
      paginationWrap.style.display = 'none';
      return;
    }
    paginationWrap.style.display = 'flex';

    if (prevBtn) prevBtn.disabled = (currentBranchPage === 0);
    if (nextBtn) nextBtn.disabled = (currentBranchPage >= totalPages - 1);

    wordsWrap.innerHTML = '';
    for (var i = 0; i < totalPages; i++) {
      var word = NUMBER_WORDS[i] || ('Page ' + (i + 1));
      var wordBtn = document.createElement('button');
      wordBtn.type = 'button';
      wordBtn.className = 'page-word-btn' + (i === currentBranchPage ? ' active' : '');
      wordBtn.textContent = word;
      wordBtn.setAttribute('data-testid', 'start-branch-page-' + word.toLowerCase() + '-button');
      wordBtn.setAttribute('aria-label', 'Go to branch page ' + word);

      (function (pageIdx) {
        wordBtn.addEventListener('click', function () {
          currentBranchPage = pageIdx;
          renderBranchPage();
        });
      })(i);

      wordsWrap.appendChild(wordBtn);
    }

    if (indicator) {
      var currWord = NUMBER_WORDS[currentBranchPage] || ('Page ' + (currentBranchPage + 1));
      var totalWord = NUMBER_WORDS[totalPages - 1] || ('Page ' + totalPages);
      indicator.innerHTML = '<span class="curr-word">' + currWord + '</span> <span class="arrow-sep">→</span> <span class="total-word">' + totalWord + '</span>';
    }
  }

  // Branch Search Input Listener
  var branchInput = $('#branch-search-input');
  if (branchInput) {
    branchInput.addEventListener('input', function () {
      branchSearchFilter = branchInput.value;
      currentBranchPage = 0;
      renderBranchPage();
    });
  }

  // Pagination Prev / Next Click Handlers
  var prevBtn = $('#prevBranchPage');
  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      var filtered = getFilteredBranches();
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentBranchPage > 0) {
        currentBranchPage--;
        renderBranchPage();
      }
    });
  }

  var nextBtn = $('#nextBranchPage');
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      var filtered = getFilteredBranches();
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      if (currentBranchPage < totalPages - 1) {
        currentBranchPage++;
        renderBranchPage();
      }
    });
  }

  // Initial Branch Grid Render
  renderBranchPage();

  /* ==========================================================================
     5. ELIGIBILITY CONFIRMATION & TYPEWRITER APPLICATION CREATION
     ========================================================================== */
  if (el) {
    el.addEventListener('change', function () {
      var chkHidden = document.getElementById('chk-eligibility-agreed');
      if (chkHidden) chkHidden.checked = el.checked;
      update();
    });
  }

  // Typewriter Terminal Animation Generator
  async function startTypewriterLoader(appNumber) {
    var loader = $('#app-creation-loader');
    var output = $('#terminal-output');
    if (!loader || !output) return;

    loader.classList.add('active');
    output.innerHTML = '';

    var logs = [
      { text: "> Initializing zero-knowledge handshake with Core Ledger...", delay: 280 },
      { text: "> Authenticating branch routing: " + st.name + " (" + st.code + ")", delay: 350 },
      { text: "> Generating unforgeable 256-bit application state hash...", delay: 420 },
      { text: "> Minting secure application reference...", delay: 300 },
      { text: "> Application number is: " + appNumber, delay: 500, highlight: true },
      { text: "> Synchronizing onboarding vault. Directing to uniform form...", delay: 400 }
    ];

    for (var i = 0; i < logs.length; i++) {
      var item = logs[i];
      var lineEl = document.createElement('div');
      lineEl.className = 'term-line' + (item.highlight ? ' highlight-app-line' : '');
      output.appendChild(lineEl);

      await typeLine(lineEl, item.text, item.highlight, appNumber);
      await sleep(item.delay);
    }

    await sleep(650);

    // Transition to dedicated Step 2 application form page
    loader.classList.remove('active');
    var targetUrl = '/open_account_customer/' + encodeURIComponent(appNumber);
    window.location.href = targetUrl;
  }

  function typeLine(el, text, isHighlight, appNum) {
    return new Promise(function (resolve) {
      var idx = 0;
      var interval = setInterval(function () {
        if (idx < text.length) {
          idx++;
          var curText = text.substring(0, idx);
          if (isHighlight && curText.indexOf(appNum) !== -1) {
            var prefix = curText.substring(0, curText.indexOf(appNum));
            var matched = curText.substring(curText.indexOf(appNum));
            el.innerHTML = prefix + '<span class="neon-app-number">' + matched + '</span>';
          } else {
            el.textContent = curText;
          }
        } else {
          clearInterval(interval);
          resolve();
        }
      }, reduce ? 4 : 18);
    });
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduce ? 10 : ms); });
  }

  // Continue Button Listener
  if (go) {
    go.addEventListener('click', async function () {
      if (go.disabled) return;

      var w = $('#wipe');
      if (w && !reduce) {
        var r = go.getBoundingClientRect();
        w.style.setProperty('--x', (r.left + r.width / 2) + 'px');
        w.style.setProperty('--y', (r.top + r.height / 2) + 'px');
        w.classList.add('on');
        await sleep(350);
        w.classList.remove('on');
      }

      try {
        var payload = {
          accountType: st.type || 'SAVINGS',
          branchName: st.name || 'Mumbai Main Branch',
          branchCode: st.code || 'BOM-001',
          eligibilityConfirmed: true
        };

        var res = await fetch('/onboarding/initiate-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        var data = {};
        if (res.ok) {
          data = await res.json();
        }

        var appNum = (data && (data.applicationNumber || data.application_number)) ? (data.applicationNumber || data.application_number) :
          'APP-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);
        var secret = (data && (data.draftSecret || data.draft_secret)) ? (data.draftSecret || data.draft_secret) : 'sec_' + Math.random().toString(36).substring(2, 10);

        window.currentApplicationNumber = appNum;
        window.currentDraftSecret = secret;
        try {
          sessionStorage.setItem('draft_secret_' + appNum, secret);
          var draftData = {
            acctType: st.type || 'SAVINGS',
            branchName: st.name || 'Mumbai Main Branch',
            branchCode: st.code || 'BOM-001'
          };
          localStorage.setItem('nb_draft_' + appNum, JSON.stringify(draftData));
          localStorage.setItem('nb_app_draft', JSON.stringify(draftData));
          localStorage.setItem('neobank_last_submitted_app', appNum);
          var apps = JSON.parse(localStorage.getItem('neobank_applications') || '{}');
          apps[appNum] = {
            applicationNumber: appNum,
            status: 'DRAFT_INITIATED',
            isDraft: true,
            accountType: st.type,
            branchName: st.name,
            branchCode: st.code,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('neobank_applications', JSON.stringify(apps));
        } catch (_) { }

        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', '/open_account_customer/' + appNum);
        }

        var toolbarApp = document.getElementById('toolbar-app-number');
        if (toolbarApp) toolbarApp.textContent = appNum;
        var headerApp = document.getElementById('header-app-number-display');
        if (headerApp) headerApp.textContent = appNum;
        var badge = document.getElementById('step2-selected-account-badge');
        if (badge) badge.textContent = st.type;

        await startTypewriterLoader(appNum);

      } catch (err) {
        console.error('Error initiating draft:', err);
        var fallbackApp = 'APP-2026-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
        await startTypewriterLoader(fallbackApp);
      }
    });
  }

  update();
})();

