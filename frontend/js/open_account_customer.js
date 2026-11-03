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
  var PAGE_SIZE = 4; // 4 branches per page for 2x2 grid -> 24 branches = 6 pages (One -> Six)
  var currentBranchPage = 0;
  var branchSearchFilter = '';

  // Prerequisites & Demanded Documents Dictionary (No APY displayed)
  var D = {
    "SAVINGS": {
      "chips": [["Min Deposit", "₹ 1,000.00"], ["Min Age", "18+"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Everyday Digital"]],
      "reqs": ["Must be at least 18 years of age", "Initial deposit of at least ₹ 1,000.00 upon approval", "Resident or citizen of supported jurisdiction"],
      "docs": [["Proof of Identity", "Passport, Driver's License, or Aadhaar Card"], ["Proof of Address", "Recent utility bill (< 3 months old) or Bank statement"], ["Tax Identification", "PAN card, SSN, or National Tax ID"]]
    },
    "CHECKING": {
      "chips": [["Min Deposit", "₹ 500.00"], ["Min Age", "18+"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Transactional Checking"]],
      "reqs": ["Must be at least 18 years of age", "Zero daily minimum balance penalty", "Contactless Visa debit card issued upon account opening"],
      "docs": [["Proof of Identity", "Government-issued photo ID or Passport"], ["Proof of Address", "Utility bill, Rental agreement, or Council Tax notice"], ["Tax Identification", "PAN, SSN, or National ID"]]
    },
    "SALARY": {
      "chips": [["Min Deposit", "₹ 0.00"], ["Min Age", "18+"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Corporate Payroll"]],
      "reqs": ["Active corporate employee or salaried professional", "Zero minimum balance requirement across all tiers", "Direct recurring corporate payroll transfer credit required"],
      "docs": [["Proof of Identity", "Passport, Aadhaar, or Voter ID"], ["Employment Proof", "Latest 3 months salary payslips or Official Corporate Offer Letter"], ["Tax Identification", "PAN card or SSN"]]
    },
    "FIXED_DEPOSIT": {
      "chips": [["Min Deposit", "₹ 10,000.00"], ["Min Age", "18+"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Term Investment"]],
      "reqs": ["Must be at least 18 years of age", "Minimum initial principal lock-in of ₹ 10,000.00", "Tenure flexibility from 6 months to 60 months with compound return"],
      "docs": [["Proof of Identity", "Passport, National ID, or Driver's License"], ["Proof of Address", "Recent utility bill or municipal statement"], ["Source of Funds", "Origin bank statement verifying funding source"]]
    },
    "MONEY_MARKET": {
      "chips": [["Min Deposit", "₹ 5,000.00"], ["Min Age", "18+"], ["Monthly Fee", "₹0/mo"], ["Account Class", "High-Yield Tier"]],
      "reqs": ["Must be at least 18 years of age", "Initial deposit of at least ₹ 5,000.00 with disciplined monthly additions", "Flexible partial withdrawal options with zero lock-in fee"],
      "docs": [["Proof of Identity", "Passport or National Photo ID"], ["Proof of Address", "Bank statement or utility bill (< 3 months)"], ["Tax Identification", "PAN, SSN, or Tax Certificate"]]
    },
    "NRI_EXPAT": {
      "chips": [["Min Deposit", "₹ 5,000.00 (or $100 FX)"], ["Min Age", "18+"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Cross-Border FX"]],
      "reqs": ["Non-Resident Indian (NRI), Person of Indian Origin (PIO), or overseas expat", "Zero FX conversion surcharge on incoming wire remittances", "Instant access to multi-currency sub-ledgers (USD, EUR, GBP, AED, INR)"],
      "docs": [["Passport & Visa", "Valid passport with foreign employment/resident visa or permit"], ["Overseas Address", "Overseas utility bill, overseas bank statement, or tenancy contract"], ["Tax Declaration", "FATCA/CRS declaration and Form W-8BEN (if applicable)"]]
    },
    "STUDENT": {
      "chips": [["Min Deposit", "₹ 0.00"], ["Age Bracket", "16 - 26"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Youth Advantage"]],
      "reqs": ["Age strictly between 16 and 26 years", "Enrolled in accredited high school, college, or university program", "Zero maintenance charges and complimentary digital Visa card"],
      "docs": [["Proof of Identity", "Passport, Student National ID, or Aadhaar"], ["Student Proof", "Valid student college ID card, bonafide letter, or admission slip"], ["Address Verification", "Dormitory registration certificate or parent/guardian address proof"]]
    },
    "PENSION": {
      "chips": [["Min Deposit", "₹ 0.00"], ["Age Requirement", "60+ (or 18+ Disability)"], ["Monthly Fee", "₹0/mo"], ["Account Class", "Senior Priority"]],
      "reqs": ["Senior Citizens (60+ years) OR Disability Pension Beneficiaries (18+)", "Eligible for direct Central/State Treasury, EPS, or Defense PPO credit", "Zero balance requirement with priority door-step banking assistance"],
      "docs": [["Proof of Identity & Age", "Aadhaar Card, Passport, or Senior Citizen Card"], ["PPO / Disability Cert", "Pension Payment Order (PPO) copy or UDID Disability Certificate"], ["Proof of Address", "Aadhaar, utility bill, or Government allotment letter"]]
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
    var chaps = document.querySelectorAll('.chap');
    var panes = document.querySelectorAll('.pane');
    var steps = document.querySelectorAll('.steps div');
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

    // Transition to Step 2 form
    loader.classList.remove('active');
    var startSection = $('#onboarding-step-1');
    var wiz = $('#wizard-section');
    if (startSection) startSection.style.display = 'none';
    if (wiz) {
      wiz.style.display = 'block';
      wiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    var sampleBtn = $('#sample');
    if (sampleBtn) sampleBtn.style.display = 'inline-flex';
    if (typeof window.initUniformApplicationForm === 'function') {
      window.initUniformApplicationForm(appNumber, st.type, st.label, st.name, st.code);
    }
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
          account_type: st.type || 'SAVINGS',
          branch: st.name,
          branch_code: st.code,
          eligibility_confirmed: true
        };

        var res = await fetch('/api/onboarding/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        var data = {};
        if (res.ok) {
          data = await res.json();
        }

        var appNum = (data && data.application_number) ? data.application_number :
                     'APP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
        var secret = (data && data.draft_secret) ? data.draft_secret : 'sec_' + Math.random().toString(36).substring(2, 10);

        window.currentApplicationNumber = appNum;
        window.currentDraftSecret = secret;
        try { sessionStorage.setItem('draft_secret_' + appNum, secret); } catch (_) {}

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


// =================================================================
// STEP 2: UNIFORM APPLICATION FORM ENGINE & 3D INTERACTIVE WORKBENCH
// =================================================================
window.initUniformApplicationForm = function (appNum, accType, accLabel, branchName, branchCode) {
  if (window._uniformFormInitialized && window._currentUniformNum === appNum) {
    return;
  }
  window._uniformFormInitialized = true;
  window._currentUniformNum = appNum;



var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,S={appType:'NEW',accCategory:'NORMAL',form60:'NO',acctType:(new URLSearchParams(location.search).get('type')||'SAVINGS')},page=0,view='form';

var MINS={SAVINGS:1000,CHECKING:500,SALARY:0,FIXED_DEPOSIT:10000,MONEY_MARKET:5000,NRI_EXPAT:5000,STUDENT:0,PENSION:0,BSBDA:0,OTHER:0};

var NAMES={SAVINGS:'High-yield savings',CHECKING:'Current / checking',SALARY:'Corporate salary',FIXED_DEPOSIT:'Fixed / term deposit',MONEY_MARKET:'Money market / recurring',PENSION:'Pension savings',NRI_EXPAT:'NRI / foreign expat',STUDENT:'Student / youth',BSBDA:'Basic savings (BSBDA)',OTHER:'Other'};

var slug=function(s){return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')};

var req=function(r){return r?'<i>*</i>':''};

/* field builders */

function bx(k,l,len,kind,r,o){o=o||{};var min=kind==='N'?len:1,i,h='';for(i=0;i<len;i++)h+='<input maxlength="1" inputmode="'+(kind==='N'?'numeric':'text')+'" autocomplete="off" aria-label="'+l+' character '+(i+1)+'">';

  return '<div class="f"><span class="lb">'+l+req(r)+'</span><div class="bxs" data-k="'+k+'" data-l="'+l+'" data-len="'+len+'" data-kind="'+kind+'" data-min="'+min+'"'+(o.sep?' data-sep':'')+(r?' data-r':'')+' data-testid="app-'+k+'-boxes">'+h+'</div></div>'}

function dt(k,l,r){return bx(k,l,8,'N',r,{sep:1}).replace('</span>','<small style="color:var(--ti)"> DD MM YYYY</small></span>')}

function rd(k,l,opts,r,cl){return '<div class="f"><span class="lb">'+l+req(r)+'</span><div class="pills" data-k="'+k+'" data-l="'+l+'"'+(r?' data-r':'')+' role="radiogroup" data-testid="app-'+k+'-options">'+opts.map(function(o){var a=Array.isArray(o)?o:[o,o];return '<button type="button" class="pill" role="radio" data-v="'+a[0]+'" data-testid="app-'+k+'-'+slug(a[0])+'-option">'+a[1]+'</button>'}).join('')+'</div></div>'}

function ch(k,l,opts,r){return '<div class="f"><span class="lb">'+l+req(r)+'</span><div class="pills" data-k="'+k+'" data-l="'+l+'" data-multi'+(r?' data-r':'')+' data-testid="app-'+k+'-options">'+opts.map(function(o){var a=Array.isArray(o)?o:[o,o];return '<button type="button" class="pill" role="checkbox" data-v="'+a[0]+'" data-testid="app-'+k+'-'+slug(a[0])+'-option">'+a[1]+'</button>'}).join('')+'</div></div>'}

function tx(k,l,r,t){return '<div class="f"><span class="lb">'+l+req(r)+'</span><input class="inp" type="'+(t||'text')+'" data-k="'+k+'" data-l="'+l+'"'+(r?' data-r':'')+' data-testid="app-'+k+'-input"></div>'}

function sl(k,l,opts,r){return '<div class="f"><span class="lb">'+l+req(r)+'</span><select class="sel" data-k="'+k+'" data-l="'+l+'"'+(r?' data-r':'')+' data-testid="app-'+k+'-select"><option value=""></option>'+opts.map(function(o){return '<option>'+o+'</option>'}).join('')+'</select></div>'}

function fl(k,l,hint,r,cd){return '<label class="slot'+(cd?' cond off':'')+'"'+(cd?' data-c="'+cd+'"':'')+' data-slot data-k="'+k+'" data-l="'+l+'"'+(r?' data-r':'')+' data-testid="app-'+k+'-slot"><input type="file" hidden><b>'+l+req(r)+'</b><span>'+hint+'</span><em>Choose a file</em><i class="pb"></i></label>'}

function cd(c,h){return '<div class="cond off" data-c="'+c+'">'+h+'</div>'}

var YN=['YES','NO'],PFX=['Mr.','Mrs.','Ms.','Dr.','Prof.','Other'];

var OVD=[['PASSPORT','Passport'],['VOTER_ID','Voter ID'],['DRIVING_LICENSE','Driving licence'],['AADHAAR','Aadhaar'],['NREGA','NREGA job card'],['NPR','NPR letter'],['OTHER','Other OVD'],['SALARY_PROOF','Salary proof'],['STUDENT_PROOF','Student proof'],['PENSION_PROOF','Pension proof'],['NRI_PROOF','NRI proof'],['FUNDS_PROOF','Source of funds proof']];

var today=new Date().toLocaleDateString('en-GB');

var PAGES=[

{h:'Tell us about yourself.',t:'Page 1: CIF & CKYC',s:[

 ['Form header & branch information','<div class="row"><div class="f"><span class="lb">Date</span><span class="fixed">'+today+'</span></div><div class="f"><span class="lb">Branch</span><span class="fixed">Mumbai Main Branch (BOM-001)</span></div></div>'+bx('ckyc','CKYC number (if you have one)',14,'N',0)+bx('cif','CIF number (if you have one)',10,'N',0)+rd('appType','Application type',[['NEW','New account']],1)+rd('accCategory','Account category',[['NORMAL','Normal'],['SMALL','Small'],['MINOR','Minor'],['STAFF','Staff']],1)],

 ['1. Personal details (same as ID proof)',rd('namePrefix','Title',PFX,1)+tx('firstName','First name','e.g. Alexander',1,'text',50)+tx('middleName','Middle name','e.g. Victor',0,'text',50)+tx('lastName','Last name','e.g. Vance',1,'text',50)+tx('prevName','Previous name, if any','e.g. Maiden name',0,'text',50)+dt('dob','Date of birth',1)+rd('gender','Gender',[['MALE','Male'],['FEMALE','Female'],['TRANSGENDER','Transgender']],1)+rd('marital','Marital status',[['MARRIED','Married'],['UNMARRIED','Unmarried'],['OTHERS','Others']],1)+rd('nationality','Nationality',[['IN','Indian'],['OTHERS','Others']],1)+tx('father','Father’s name','Father full name',1,'text',50)+tx('mother','Mother’s name','Mother full name',1,'text',50)+tx('spouse','Spouse’s name, if married','Spouse full name',0,'text',50)+cd('accCategory=MINOR',rd('guardianPrefix','Guardian title',PFX,1)+tx('guardian','Guardian’s name','Guardian full name',1,'text',50)+rd('guardianRel','Guardian is',['Father','Mother','Legal Guardian'],1))+rd('religion','Religion',['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Others'],1)+rd('category','Category',['General','OBC','SC','ST'],1)+rd('disability','Do you have a disability?',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+cd('disability=YES',ch('assist','Assistance you would like',['Braille Passbook','Talking ATM','Wheelchair Access','Doorstep Banking','Large Print'],0)+fl('disabCert','Disability certificate','PDF, JPG or PNG',0))+rd('edu','Education',['Below SSC','SSC/HSC','Graduate','Post Graduate','Professional'],1)],

 ['2. Occupation & financial profile',rd('emp','Employment status',[['EMPLOYED','Employed'],['PRIVATE_SECTOR','Private sector'],['BUSINESS','Business'],['SELF_EMPLOYED','Self-employed'],['RETIRED','Retired'],['HOUSEWIFE','Homemaker'],['STUDENT','Student'],['OTHERS','Others']],1)+'<div class="row">'+tx('employer','Employer or business name',0)+tx('university','University or institution (students)',0)+'</div>'+rd('income','Annual income',['Below 1 Lakh','1-5 Lakh','5-10 Lakh','10-25 Lakh','Above 25 Lakh'],1)+rd('funds','Source of funds',['Salary','Business Income','Agriculture','Investments','Inheritance / Family','Professional Fees'],1)],

 ['3. Identification & tax information',cd('form60=NO',bx('pan','PAN',10,'X',1))+rd('form60','Do you file Form 60 instead of PAN?',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+cd('form60=YES',fl('form60Doc','Form 60 document','PDF, JPG or PNG',1))+bx('aadhaar','Aadhaar number',12,'N',1)+rd('pep','Politically exposed person?',[['NA','Not applicable'],['PEP','I am a PEP'],['RELATED','Related to a PEP']],1)],

 ['4. Contact details',bx('mobile','Mobile number',10,'N',1)+bx('altMobile','Alternate mobile',10,'N',0)+'<div class="row">'+tx('emailUser','Email (before the @)',1)+sl('emailDomain','Email domain',['gmail.com','yahoo.com','outlook.com','icloud.com'],1)+'</div>']]},

{h:'Prove who you are.',t:'Page 2: KYC & OVD',s:[

 ['5. Proof of identity / address (OVD)',ch('ovd','Choose the documents you will upload',OVD,1)+'<div class="slots">'+OVD.map(function(o){return fl('ovd'+o[0],o[1],'PDF, JPG or PNG',1,'ovd='+o[0])}).join('')+'</div><p class="hint">Files are encrypted when you upload them. In this preview they never leave your device.</p>'],

 ['6. Address details',rd('addrType','Address type',[['RESIDENTIAL_BUSINESS','Residential and business'],['RESIDENTIAL','Residential'],['BUSINESS','Business'],['REGISTERED_OFFICE','Registered office']],1)+'<div class="row">'+tx('house','House or flat number',1)+tx('street','Street',1)+tx('landmark','Landmark',0)+tx('city','City',1)+tx('district','District',1)+tx('state','State',1)+'</div>'+bx('pincode','PIN code',6,'N',1)+rd('corrSame','Is your correspondence address the same?',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+cd('corrSame=NO',bx('corrPincode','Correspondence PIN code',6,'N',1)+tx('corrAddr','Correspondence address',1))+ch('deemed','Deemed proof of address (optional)',[['UTILITY','Utility bill'],['PROPERTY_TAX','Property tax receipt'],['PENSION_ORDER','Pension order'],['GOVT_ACCOMMODATION','Govt. accommodation letter'],['LEAVE_LICENSE','Leave and licence']],0)],

 ['7. Applicant photograph & verification signature','<div class="row">'+fl('photo','Passport-size photograph','Plain background',1)+'<div class="f"><span class="lb">Signature'+req(1)+'</span><div class="sigw" data-k="signature" data-l="Signature" data-r data-testid="app-signature-pad"><canvas id="sig"></canvas><button type="button" class="ghost sm" id="sigclr" data-testid="app-signature-clear-button">Clear</button><p id="sigp">Draw your signature here</p></div></div></div>']]},

{h:'Shape your account.',t:'Page 3: Account Form',s:[

 ['1. Type of account requested',rd('acctType','Account type',Object.keys(NAMES).map(function(k){return [k,NAMES[k]]}),1)],

 ['2. Mode of operation',rd('mode','Mode of operation',[['SELF_SINGLE','Self / single'],['EITHER_SURVIVOR','Either or survivor'],['FORMER_SURVIVOR','Former or survivor'],['JOINTLY','Jointly'],['MINOR_GUARDIAN','Minor with guardian']],1)+cd('mode=JOINTLY',tx('jointCount','Number of joint holders',1,'number'))],

 ['3. Services & channels required',rd('svcCheque','Cheque book',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+rd('svcDebit','Debit card',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+cd('svcDebit=YES',rd('cardScheme','Card scheme',[['RUPAY','RuPay'],['VISA','Visa'],['MASTERCARD','Mastercard']],1)+rd('cardFormat','Card format',[['BOTH','Both'],['VIRTUAL','Virtual'],['METAL','Metal']],1)+tx('cardName','Name on card','Name to print on debit card',1,'text',50))+rd('svcNet','Net banking',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+rd('svcMob','Mobile banking',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+rd('svcSms','SMS alerts',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)+rd('svcStmt','E-statement',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1)],

 ['4. Fixed / recurring deposit instructions (only if applicable)',cd('acctType=FIXED_DEPOSIT|MONEY_MARKET',rd('fdPayout','Interest payout',['Monthly','Quarterly','On Maturity'],1)+rd('fdMaturity','On maturity',['Auto Renew','Credit to A/C'],1))+'<p class="hint" id="fdn">Not needed for the account you chose.</p>'],

 ['5. Initial deposit / payment details','<div class="row"><div class="f"><span class="lb">Initial deposit (₹)'+req(1)+'</span><input class="inp" type="number" id="dep" min="0" data-testid="app-deposit-input"><p class="hint" id="dephint"></p></div><div class="f"><span class="lb">Amount in words</span><span class="fixed" id="words" style="display:block">—</span></div></div>'+rd('payMode','Payment mode',['Cash','Cheque / DD','Transfer from Existing Account'],1)+'<div class="f"><span class="lb">Online banking login password'+req(1)+'</span><input class="inp" type="password" id="pw" autocomplete="new-password" data-testid="app-password-input"><div class="meter"><i id="pwm"></i></div><p class="hint">At least 8 characters.</p></div>'],

 ['6. Joint applicant details (if joint account)',cd('mode=JOINTLY|EITHER_SURVIVOR|FORMER_SURVIVOR',tx('jName','Joint holder’s name','Joint applicant full name',1,'text',50)+dt('jDob','Joint holder’s date of birth',1)+sl('jRel','Relationship',['Spouse','Parent','Child','Sibling','Other'],1))+'<p class="hint" id="jn">Only needed for joint modes of operation.</p>']]},

{h:'Sign off.',t:'Page 4: Declarations',s:[

 ['1. Nomination details',rd('nomination','Nomination',[['REGISTER','Register a nominee'],['DECLINE','Decline nomination']],1)+cd('nomination=REGISTER',rd('nomPrefix','Nominee title',PFX,1)+tx('nomName','Nominee’s name','Nominee full name',1,'text',50)+sl('nomRel','Relationship',['Spouse','Parent','Child','Sibling','Other'],1)+rd('nomPassbook','Print nominee on passbook',YN.map(function(x){return [x,x==='YES'?'Yes':'No']}),1))],

 ['2. FATCA / CRS declaration',rd('fatca','Tax residency',[['INDIA_ONLY','India only'],['OUTSIDE_INDIA','Outside India as well']],1)+cd('fatca=OUTSIDE_INDIA','<div class="row">'+tx('taxCountry','Country of tax residence',1)+tx('tin','Tax identification number',1)+'</div>')],

 ['3. Final declaration & signatures','<label class="chk" data-k="decl" data-l="Declaration" data-r data-testid="app-declaration-checkbox"><input type="checkbox" id="declc"><i><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></i><span>I declare that the information I have given is true and complete, and I understand that my account is opened only after the bank approves my application. The signature I drew on Page 2 is mine.</span></label><p class="hint">Date: '+today+'</p>']]}

];

/* build */

$('#pages').innerHTML=PAGES.map(function(p,i){return '<div class="pg" data-pg="'+i+'"><div class="shead"><span>NeoBank · Uniform account opening form</span><span>Page '+(i+1)+' of 4</span></div>'+p.s.map(function(s,j){var sc=/Joint applicant/.test(s[0])?' cond off" data-c="mode=JOINTLY|EITHER_SURVIVOR|FORMER_SURVIVOR':'';return '<section class="card sec'+sc+'" data-sec="'+i+'-'+j+'" data-testid="app-section-'+slug(s[0])+'"><h2>'+s[0]+'</h2><span class="stamp">COMPLETE</span>'+s[1]+'</section>'}).join('')+'</div>'}).join('');

$('#tabs').innerHTML=PAGES.map(function(p,i){return '<button class="tab" data-tab="'+i+'" data-testid="app-tab-page-'+(i+1)+'-button">'+p.t+'</button>'}).join('')+'<button class="tab" id="all" data-testid="app-view-all-pages-button">View all 4 pages</button>';

function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(function(){t.classList.remove('on')},2200)}

var sv;function saved(){var s=$('#save');s.classList.add('busy');s.querySelector('em').textContent='Saving…';clearTimeout(sv);sv=setTimeout(function(){s.classList.remove('busy');s.querySelector('em').textContent='Draft saved'},800)}

function act(e){return !e.closest('.cond.off')}

function reqs(root){return $$((root||'')+' [data-r]').filter(act)}

function val(e){var v=S[e.dataset.k];if(e.classList.contains('bxs'))return !!v&&v.length>=+e.dataset.min;if(Array.isArray(v))return v.length>0;return !!v}

function cond(){$$('.cond').forEach(function(c){var p=c.dataset.c.split('='),vs=p[1].split('|'),v=S[p[0]],on=Array.isArray(v)?v.some(function(x){return vs.indexOf(x)>-1}):vs.indexOf(v)>-1;c.classList.toggle('off',!on)});

  $('#fdn').hidden=!$('[data-c^="acctType"]').classList.contains('off');$('#jn').hidden=!$('[data-c^="mode=JOINTLY|"]').classList.contains('off')}

function nav(){var h='';$$('.pg.on .sec').filter(act).forEach(function(s){h+='<a data-sec="'+s.dataset.sec+'" data-testid="app-nav-'+slug(s.querySelector('h2').textContent)+'-link"><i></i>'+s.querySelector('h2').textContent.replace(/^\d\.\s/,'').replace(/\s\(.*/,'')+'</a>'});$('#secnav').innerHTML=h}

function pctOf(i){var r=reqs('.pg[data-pg="'+i+'"]');return r.length?Math.round(r.filter(val).length/r.length*100):0}

function update(){

  cond();var all=reqs(),n=all.filter(val).length,p=all.length?Math.round(n/all.length*100):0;

  $('#pct').textContent=p+'%';$('#rv').style.strokeDashoffset=176-176*p/100;

  $$('.sec').forEach(function(s){var r=reqs('.sec[data-sec="'+s.dataset.sec+'"]');s.classList.toggle('ok',r.length>0&&r.every(val))});

  nav();$$('#secnav a').forEach(function(a){a.classList.toggle('ok',$('.sec[data-sec="'+a.dataset.sec+'"]').classList.contains('ok'))});

  var left=reqs('.pg.on').filter(function(e){return !val(e)}).length;

  if(view==='form')$('#left').textContent=left?left+' required '+(left===1?'item':'items')+' left on this page':'This page is complete';

  $('#acn').textContent=NAMES[S.acctType]||'';$('#acm').textContent='Minimum deposit ₹ '+(MINS[S.acctType]||0).toLocaleString('en-IN')+'.00';

}

/* 3D page turn */

function steps(n){$$('#steps li').forEach(function(l,i){l.className=i+1<n?'fin':i+1===n?'cur':''})}

function done(el,cls){el.addEventListener('animationend',function f(e){if(e.target!==el)return;el.removeEventListener('animationend',f);cls()})}

function show(i,dir){

  var old=$('.pg.on'),nw=$$('.pg')[i];dir=dir||(i>=page?1:-1);page=i;view='form';$('#rev').hidden=true;$('#pages').hidden=false;

  if(old!==nw){if(old){if(reduce)old.classList.remove('on');else{old.classList.add(dir>0?'out':'outb');done(old,function(){old.classList.remove('on','out','outb')})}}

    nw.classList.add('on');if(!reduce){nw.classList.add(dir>0?'in':'inb');done(nw,function(){nw.classList.remove('in','inb')})}}

  $('#title').textContent=PAGES[i].h;steps(2);$$('.tab[data-tab]').forEach(function(t){t.classList.toggle('on',+t.dataset.tab===i)});$('#tabs').hidden=false;

  $('#back').style.visibility=i?'visible':'hidden';$('#next').textContent=i<3?'Continue':'Review application';$('#bar').hidden=false;

  update();fit();scrollTo({top:0,behavior:reduce?'auto':'smooth'});

}

function review(){

  view='review';$('#pages').hidden=true;$('#rev').hidden=false;$('#tabs').hidden=true;steps(3);$('#title').textContent='Check everything.';$('#next').textContent='Submit application';$('#secnav').innerHTML='';

  $('#rev').innerHTML=PAGES.map(function(p,i){var secs=$$('.pg[data-pg="'+i+'"] .sec').filter(act).map(function(s){var rows=$$('[data-k]',s).filter(act).map(function(e){var v=S[e.dataset.k];if(v===true)v='Provided';if(Array.isArray(v))v=v.join(', ');if(e.dataset.k==='pw'||e.id==='pw')v='••••••••';return '<div><dt>'+e.dataset.l+'</dt><dd>'+(v?String(v).replace(/</g,'&lt;'):'Not provided')+'</dd></div>'}).join('');return rows?'<h4>'+s.querySelector('h2').textContent+'</h4><dl>'+rows+'</dl>':''}).join('');return '<section class="card"><h3>'+p.t+'<button class="ghost sm" data-edit="'+i+'" data-testid="app-edit-page-'+(i+1)+'-button">Edit</button></h3>'+secs+'</section>'}).join('');

  $('#left').textContent='Last look before you submit.';scrollTo({top:0,behavior:reduce?'auto':'smooth'})}

async function finish() {
    view = 'done';
    $('#bar').hidden = true;
    $('#rev').hidden = true;
    $('#done').hidden = false;
    steps(4);
    $('#title').textContent = 'All set.';
    $('#tabs').hidden = true;
    $('#no2').textContent = num;
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });

    var submitPayload = {
      applicationNumber: num,
      accountType: S.acctType || 'SAVINGS',
      currency: 'USD',
      branchName: S.branchName || 'Mumbai Main Branch',
      branchCode: S.branchCode || 'BOM-001',
      applicant: {
        firstName: S.firstName || 'Alexander',
        lastName: S.lastName || 'Vance',
        email: (S.emailUser ? (S.emailUser + '@' + (S.emailDomain || 'gmail.com')) : 'alexander.vance@example.com'),
        phone: S.mobile || '9876543210',
        dob: (S.dob && S.dob.length === 8 ? (S.dob.slice(4) + '-' + S.dob.slice(2, 4) + '-' + S.dob.slice(0, 2)) : '1994-05-12'),
        address: {
          street: (S.house ? (S.house + ', ' + (S.street || '')) : '123 Marine Drive'),
          city: S.city || 'Mumbai',
          state: S.state || 'Maharashtra',
          postalCode: S.pincode || '400001',
          country: 'India'
        }
      },
      email: (S.emailUser ? (S.emailUser + '@' + (S.emailDomain || 'gmail.com')) : 'alexander.vance@example.com'),
      password: S.pw || 'DemoPassword@2026',
      taxId: S.pan || 'ABCDE1234F',
      employment: {
        status: S.emp || 'EMPLOYED',
        employer: S.employer || 'Corporate Corp',
        annualIncome: 50000
      },
      initialDeposit: parseFloat(S.dep) || MINS[S.acctType] || 1000,
      identityDocument: {
        documentType: (S.ovd && S.ovd[0]) || 'PASSPORT',
        documentNumber: S.aadhaar || '987654321012',
        documentId: 'doc_id_' + Date.now(),
        verified: true
      },
      addressProof: {
        documentType: 'UTILITY_BILL',
        documentNumber: S.pincode || '400001',
        documentId: 'doc_addr_' + Date.now(),
        verified: true
      },
      agreedToTerms: true,
      cardScheme: S.cardScheme || 'RUPAY',
      cardFormat: S.cardFormat || 'BOTH',
      formData: S
    };

    try {
      var apps = JSON.parse(localStorage.getItem('neobank_applications') || '{}');
      apps[num] = {
        applicationNumber: num,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        accountType: S.acctType,
        branchName: S.branchName,
        applicant: submitPayload.applicant,
        formData: S
      };
      localStorage.setItem('neobank_applications', JSON.stringify(apps));
      localStorage.setItem('neobank_last_submitted_app', num);

      await fetch('/api/v1/onboarding/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
      }).catch(function(e) {
        console.warn('Backend API submission sync:', e);
      });
    } catch (err) {
      console.error('Submission error:', err);
    }
  }

function bad(list){list.forEach(function(e){var t=e.matches('.bxs,.pills,.sigw,.slot,.chk')?e:e;t.classList.add('bad');setTimeout(function(){t.classList.remove('bad')},2600)});var f=list[0],c=f.closest('.sec');(c||f).scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});if(c){c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake')}}

$('#next').onclick=function(){

  if(view==='form'){var m=reqs('.pg.on').filter(function(e){return !val(e)});if(m.length){bad(m);toast('Please complete the highlighted items');return}page<3?show(page+1,1):review()}

  else if(view==='review'){var a=reqs().filter(function(e){return !val(e)});if(a.length){toast('Some items are missing');return}finish()}};

$('#back').onclick=function(){view==='review'?show(3,-1):page>0&&show(page-1,-1)};

/* all-pages 3D fan */

$('#fr').innerHTML=PAGES.map(function(p,i){return '<button class="tile" style="--i:'+i+'" data-go="'+i+'" data-testid="app-fan-page-'+(i+1)+'-button"><div><b>'+(i+1)+'</b><br><span>'+p.t.replace(/^Page \d: /,'')+'</span></div><em class="pc"></em></button>'}).join('');

$('#all').onclick=function(){$$('.pc').forEach(function(e,i){e.textContent=pctOf(i)+'% done'});$('#fan').hidden=false};

$('#fanx').onclick=function(){$('#fan').hidden=true};

/* delegated interaction */

function pick(g,v){var k=g.dataset.k;if(g.hasAttribute('data-multi')){var a=S[k]||[],ix=a.indexOf(v);ix>-1?a.splice(ix,1):a.push(v);S[k]=a.slice()}else S[k]=v;paint(g)}

function paint(g){var v=S[g.dataset.k];$$('.pill',g).forEach(function(p){var on=Array.isArray(v)?v.indexOf(p.dataset.v)>-1:v===p.dataset.v;p.classList.toggle('on',on);p.setAttribute('aria-checked',on)})}

document.addEventListener('click',function(e){var t=e.target,x;

  if(x=t.closest('[data-tab]')){show(+x.dataset.tab);return}

  if(x=t.closest('[data-go]')){$('#fan').hidden=true;show(+x.dataset.go);return}

  if(x=t.closest('[data-edit]')){show(+x.dataset.edit,-1);return}

  if(x=t.closest('#secnav a')){$('.sec[data-sec="'+x.dataset.sec+'"]').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});return}

  if(x=t.closest('.pill')){pick(x.parentNode,x.dataset.v);saved();update();return}});

$$('.pills').forEach(paint);

/* box inputs */

function collect(g){var s=$$('input',g).map(function(i){return i.value||' '}).join('').replace(/\s+$/,'');S[g.dataset.k]=s;saved();update()}

function clean(g,v){var k=g.dataset.kind;return k==='N'?v.replace(/\D/g,''):k==='A'?v.replace(/[^A-Za-z ]/g,'').toUpperCase():v.replace(/[^A-Za-z0-9]/g,'').toUpperCase()}

function setBoxes(g,str){str=clean(g,str);$$('input',g).forEach(function(i,n){i.value=str[n]||''});collect(g)}

document.addEventListener('input',function(e){var t=e.target,g=t.closest('.bxs');

  if(g){t.value=clean(g,t.value).slice(-1);if(t.value){t.classList.remove('pop');void t.offsetWidth;t.classList.add('pop');var n=t.nextElementSibling;n&&n.focus()}collect(g);

    if(/^(firstName|lastName)$/.test(g.dataset.k)&&!S.cardName)autoCard();return}

  if(t.id==='dep'){var n=+t.value,m=MINS[S.acctType]||0;S.deposit=t.value!==''&&n>=m?n:'';$('#dephint').className='hint'+(t.value!==''&&n<m?' err':'');$('#dephint').textContent=t.value!==''&&n<m?'The minimum deposit for this account is ₹ '+m.toLocaleString('en-IN')+'.00.':'Minimum deposit: ₹ '+m.toLocaleString('en-IN')+'.00';$('#words').textContent=n>0?'Rupees '+words(n)+' only':'—'}

  else if(t.id==='pw'){var v=t.value,sc=(v.length>7)+(/[A-Z]/.test(v)&&/[a-z]/.test(v))+(/\d/.test(v))+(/[^A-Za-z0-9]/.test(v));$('#pwm').style.width=(v?Math.max(1,sc)*25:0)+'%';S.pw=v.length>=8?v:''}

  else if(t.dataset&&t.dataset.k&&!t.closest('.slot'))S[t.dataset.k]=t.value;

  saved();update()});

document.addEventListener('change',function(e){var t=e.target;if(t.id==='declc'){S.decl=t.checked;saved();update()}else if(t.matches('select[data-k]')){S[t.dataset.k]=t.value;saved();update()}});

document.addEventListener('keydown',function(e){var t=e.target,g=t.closest&&t.closest('.bxs');if(!g)return;

  if(e.key==='Backspace'&&!t.value){var p=t.previousElementSibling;if(p){p.value='';p.focus();collect(g)}}

  else if(e.key==='ArrowLeft'&&t.previousElementSibling)t.previousElementSibling.focus();else if(e.key==='ArrowRight'&&t.nextElementSibling)t.nextElementSibling.focus()});

document.addEventListener('paste',function(e){var t=e.target,g=t.closest&&t.closest('.bxs');if(!g)return;e.preventDefault();var v=clean(g,(e.clipboardData||window.clipboardData).getData('text')),is=$$('input',g),s=is.indexOf(t);v.split('').forEach(function(c,n){if(is[s+n])is[s+n].value=c});collect(g)});

function autoCard(){var g=$('[data-k="cardName"]'),f=S.firstName||'',l=S.lastName||'';if(g&&(f||l)){$$('input',g).forEach(function(i,n){i.value=((f+' '+l).trim().slice(0,19))[n]||''});S.cardName=((f+' '+l).trim()).slice(0,19);S.cardName=''}}

function words(n){var o=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],t=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  function b(x){return x<20?o[x]:t[Math.floor(x/10)]+(x%10?' '+o[x%10]:'')}function h(x){return (x>99?o[Math.floor(x/100)]+' Hundred'+(x%100?' ':''):'')+(x%100?b(x%100):'')}

  var r=[],c=Math.floor(n/1e7),l=Math.floor(n%1e7/1e5),th=Math.floor(n%1e5/1e3),rest=n%1e3;if(c)r.push(h(c)+' Crore');if(l)r.push(b(l)+' Lakh');if(th)r.push(b(th)+' Thousand');if(rest)r.push(h(rest));return r.join(' ')}

/* uploads */

function attach(s,name,file){s.classList.add('on');var em=s.querySelector('em');em.textContent='Encrypting…';setTimeout(function(){em.textContent=name+' · encrypted'},reduce?0:1100);S[s.dataset.k]=name;

  if(file&&s.dataset.k==='photo'&&/^image/.test(file.type)){var r=new FileReader();r.onload=function(){var im=s.querySelector('img')||s.appendChild(document.createElement('img'));im.src=r.result;im.alt='Your photograph'};r.readAsDataURL(file)}saved();update()}

$$('.slot').forEach(function(s){s.querySelector('input').onchange=function(){if(this.files[0])attach(s,this.files[0].name,this.files[0])}});

/* signature */

var cv=$('#sig'),cx=cv.getContext('2d'),dr=false,has=false;

function fit(){var r=cv.getBoundingClientRect();if(r.width>0&&!has){var d=Math.min(devicePixelRatio||1,2);cv.width=r.width*d;cv.height=r.height*d;cx.setTransform(d,0,0,d,0,0);cx.strokeStyle='#00f59b';cx.lineWidth=2.6;cx.lineCap='round';cx.lineJoin='round'}}

function pt(e){var r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}

cv.onpointerdown=function(e){dr=true;cv.setPointerCapture(e.pointerId);var p=pt(e);cx.beginPath();cx.moveTo(p[0],p[1]);$('#sigp').style.opacity=0};

cv.onpointermove=function(e){if(!dr)return;var p=pt(e);cx.lineTo(p[0],p[1]);cx.stroke();has=true};

cv.onpointerup=function(){dr=false;if(has){S.signature='Signed';saved();update()}};

$('#sigclr').onclick=function(){has=false;cx.clearRect(0,0,cv.width,cv.height);S.signature='';$('#sigp').style.opacity=1;update()};

/* sample data */

$('#sample').onclick=function(){

  for(var pass=0;pass<4;pass++){cond();$$('[data-k]').filter(act).forEach(function(e){if(val(e))return;

    if(e.classList.contains('bxs')){var k=e.dataset.kind,L=+e.dataset.len;setBoxes(e,k==='N'?(e.dataset.k==='dob'||e.dataset.k==='jDob'?'12051994':'9876501234567890'.slice(0,L)):e.dataset.k==='pan'?'ABCDE1234F':'SAMPLE')}

    else if(e.classList.contains('pills')){var p=$('.pill',e);pick(e,p.dataset.v)}

    else if(e.matches('select')){e.selectedIndex=1;S[e.dataset.k]=e.value}

    else if (e.matches('input.inp') && e.type !== 'file') {
      if (e.dataset.k === 'firstName') e.value = 'Alexander';
      else if (e.dataset.k === 'lastName') e.value = 'Vance';
      else if (e.dataset.k === 'middleName') e.value = 'Victor';
      else if (e.dataset.k === 'father') e.value = 'Arthur Vance';
      else if (e.dataset.k === 'mother') e.value = 'Eleanor Vance';
      else if (e.dataset.k === 'emailUser') e.value = 'alexander.vance';
      else if (e.dataset.k === 'house') e.value = '42A Skyline Tower';
      else if (e.dataset.k === 'street') e.value = 'Marine Drive';
      else if (e.dataset.k === 'city') e.value = 'Mumbai';
      else if (e.dataset.k === 'district') e.value = 'Mumbai City';
      else if (e.dataset.k === 'state') e.value = 'Maharashtra';
      else if (e.dataset.k === 'corrAddr') e.value = 'Same as permanent residence';
      else if (e.dataset.k === 'cardName') e.value = 'ALEXANDER VANCE';
      else if (e.dataset.k === 'jName') e.value = 'Victoria Vance';
      else if (e.dataset.k === 'nomName') e.value = 'Sarah Vance';
      else if (e.dataset.k === 'nomAddr') e.value = '42A Skyline Tower, Marine Drive, Mumbai';
      else e.value = e.type === 'number' ? '2' : 'Sample Data';
      S[e.dataset.k] = e.value;
    }

    else if(e.matches('.slot'))attach(e,'sample.pdf')

    else if(e.classList.contains('sigw')){fit();has=true;cx.beginPath();cx.moveTo(30,110);cx.bezierCurveTo(60,20,90,20,100,90);cx.bezierCurveTo(110,130,150,40,190,70);cx.bezierCurveTo(215,90,240,60,270,80);cx.stroke();S.signature='Signed'}

    else if(e.id==='declc'||e.dataset.k==='decl'){$('#declc').checked=true;S.decl=true}});

    var dep=$('#dep');dep.value=Math.max(MINS[S.acctType]||0,1000);dep.dispatchEvent(new Event('input',{bubbles:true}));var pw=$('#pw');pw.value='Sample@1234';pw.dispatchEvent(new Event('input',{bubbles:true}));update()}

  update();toast('Sample data filled. Press Continue.')};

/* reference + copy */

// Application reference number
num = num || ('APP-2026-' + (100000 + Math.floor(Math.random() * 899999)));

(function(){var el=$('#appno'),n=0,c='0123456789';if(reduce){el.textContent=num;return}var iv=setInterval(function(){n++;el.textContent=num.split('').map(function(ch,i){return i>=9&&i>=n/2+3?c[Math.floor(Math.random()*10)]:ch}).join('');if(n>26){clearInterval(iv);el.textContent=num}},45)})();

$('#copy').onclick=function(){try{navigator.clipboard.writeText(num).then(function(){toast('Reference copied')},function(){toast(num)})}catch(e){toast(num)}};

/* tilt on the account card */

var ac=$('#acct');if(!reduce&&matchMedia('(hover:hover)').matches){ac.addEventListener('pointermove',function(e){var r=ac.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;ac.style.transform='perspective(700px) rotateY('+x*16+'deg) rotateX('+(-y*16)+'deg)'});ac.addEventListener('pointerleave',function(){ac.style.transform=''})}

/* currents */

if(!reduce){var c=$('#fx').getContext('2d'),P=[],mx=-999,my=-999,W,H;

  function sp(p){p.x=Math.random()*W;p.y=Math.random()*H;p.s=.6+Math.random()*1.1;p.h=Math.random()<.2;return p}

  function sz(){var d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;$('#fx').width=W*d;$('#fx').height=H*d;c.setTransform(d,0,0,d,0,0);c.fillStyle='#04060b';c.fillRect(0,0,W,H);P=[];for(var i=0;i<(W<700?40:90);i++)P.push(sp({}))}

  addEventListener('resize',sz);sz();addEventListener('pointermove',function(e){mx=e.clientX;my=e.clientY},{passive:true});

  (function f(t){requestAnimationFrame(f);if(document.hidden)return;c.fillStyle='rgba(4,6,11,.09)';c.fillRect(0,0,W,H);

    P.forEach(function(p){var a=Math.sin(p.x*.0028+t*.00016)*2.4+Math.cos(p.y*.0035-t*.00013)*2.4,d=Math.hypot(mx-p.x,my-p.y);if(d<160)a+=(1-d/160)*2.2;var ox=p.x,oy=p.y;p.x+=Math.cos(a)*p.s*1.2;p.y+=Math.sin(a)*p.s*1.2;

      if(p.x<0||p.y<0||p.x>W||p.y>H){sp(p);return}c.strokeStyle=p.h?'rgba(0,245,155,.4)':'rgba(190,215,255,.12)';c.beginPath();c.moveTo(ox,oy);c.lineTo(p.x,p.y);c.stroke()})})(0)}

$('#dephint').textContent='Minimum deposit: ₹ '+(MINS[S.acctType]||0).toLocaleString('en-IN')+'.00';

$$('.pg')[0].classList.add('on');show(0,1);




  var changeLink = $('#app-change-selection-link');
  if (changeLink) {
    changeLink.onclick = function(e) {
      e.preventDefault();
      var wiz = $('#wizard-section');
      var start = $('#onboarding-step-1');
      if (wiz) wiz.style.display = 'none';
      if (start) {
        start.style.display = 'block';
        start.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  }

};

// Auto-initialize if Step 2 is directly visible on load or query param present
document.addEventListener('DOMContentLoaded', function () {
  var wiz = document.getElementById('wizard-section');
  var params = new URLSearchParams(window.location.search);
  var path = window.location.pathname;
  if ((wiz && wiz.style.display !== 'none') || params.get('step') === '2' || path.indexOf('/open_account_customer/APP') !== -1) {
    var appMatch = path.match(/APP-[0-9A-Za-z-]+/) || [params.get('app') || ''];
    if (typeof window.initUniformApplicationForm === 'function') {
      window.initUniformApplicationForm(appMatch[0] || '', params.get('type') || 'SAVINGS', '', '', '');
    }
  }
});
