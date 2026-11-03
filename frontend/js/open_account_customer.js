/**
 * NeoBank Open Account Start Page & Kinetic Onboarding Engine
 * Handles hero scroll storytelling, account selection with prerequisite documents,
 * autotype branch dropdown, eligibility confirmation, and cinematic typewriter
 * application reference generation.
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

  // Branch Master Directory
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
    { name: 'Ahmedabad Ashram Road Branch', code: 'AMD-008', city: 'Ahmedabad, Gujarat' }
  ];

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
     3. ACCOUNT CATEGORIES, SUBTYPES & PREREQUISITES
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
    var hasElig = el && el.checked;
    if (go) go.disabled = !(st.type && st.code && hasElig);

    if (sum) {
      if (!st.type) {
        sum.textContent = 'Choose an account to begin.';
      } else if (!st.code) {
        sum.textContent = st.label + '. Now choose your home branch.';
      } else if (!hasElig) {
        sum.textContent = st.label + ' at ' + st.name + '. Confirm your eligibility to continue.';
      } else {
        sum.textContent = st.label + ' at ' + st.name + '. Ready when you are.';
      }
    }
  }

  // Accordion Toggle
  $$('.cat-h').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.closest('.cat');
      var isOpen = cat.classList.contains('open');
      $$('.cat').forEach(function (x) {
        x.classList.remove('open');
        var h = x.querySelector('.cat-h');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        cat.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Account Subtype Selection
  $$('.acct').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // Toggle card active state
      $$('.acct').forEach(function (x) {
        x.setAttribute('aria-pressed', 'false');
        x.classList.remove('selected');
      });
      card.setAttribute('aria-pressed', 'true');
      card.classList.add('selected');

      // Mark parent category as having a selection
      $$('.cat').forEach(function (c) {
        c.classList.toggle('has', c.contains(card));
      });

      var first = !st.type || !st.code;
      st.type = card.dataset.type || 'SAVINGS';
      st.label = card.dataset.label || 'Savings Account';

      // Sync with underlying form hidden fields if available
      var hiddenType = document.getElementById('apply-selected-account-type');
      if (hiddenType) hiddenType.value = st.type;
      if (typeof window.selectAccountType === 'function') {
        window.selectAccountType(st.type);
      }

      lock(bs, false);
      update();

      if (first) {
        setTimeout(function () {
          look(bs);
          var branchInput = $('#branch-search-input');
          if (branchInput) branchInput.focus();
        }, 220);
      }
    });
  });

  /* ==========================================================================
     4. AUTOTYPE SEARCHABLE BRANCH DROPDOWN
     ========================================================================== */
  var branchInput = $('#branch-search-input');
  var branchList = $('#branch-dropdown-list');
  var branchSelectedTag = $('#branch-selected-tag');

  function renderBranchOptions(filterText) {
    if (!branchList) return;
    var query = (filterText || '').trim().toLowerCase();
    var matches = BRANCHES.filter(function (b) {
      if (!query) return true;
      return b.name.toLowerCase().indexOf(query) !== -1 ||
             b.code.toLowerCase().indexOf(query) !== -1 ||
             b.city.toLowerCase().indexOf(query) !== -1;
    });

    if (matches.length === 0) {
      branchList.innerHTML = '<div class="branch-no-results">No branches match "' + filterText + '"</div>';
      branchList.classList.add('open');
      return;
    }

    var html = matches.map(function (b) {
      var isSel = (b.code === st.code);
      return (
        '<div class="branch-item' + (isSel ? ' active' : '') + '" data-name="' + b.name + '" data-code="' + b.code + '">' +
          '<div class="branch-item-left">' +
            '<span class="branch-name">' + b.name + '</span>' +
            '<span class="branch-city">' + b.city + '</span>' +
          '</div>' +
          '<span class="branch-code-badge">' + b.code + '</span>' +
        '</div>'
      );
    }).join('');

    branchList.innerHTML = html;
    branchList.classList.add('open');

    // Attach click events
    $$('.branch-item').forEach(function (item) {
      item.addEventListener('click', function () {
        selectBranch(item.dataset.name, item.dataset.code);
      });
    });
  }

  function selectBranch(name, code) {
    st.name = name;
    st.code = code;

    if (branchInput) {
      branchInput.value = name;
    }
    if (branchList) {
      branchList.classList.remove('open');
    }

    if (branchSelectedTag) {
      branchSelectedTag.innerHTML = '<strong>' + name + '</strong> <span class="tag-code">' + code + '</span>';
      branchSelectedTag.style.display = 'inline-flex';
    }

    // Sync with existing form select and code inputs
    var s1Select = document.getElementById('step1-branch-select');
    var s1Code = document.getElementById('step1-branch-code');
    if (s1Select) {
      s1Select.value = name;
      if (typeof window.syncBranchSelection === 'function') {
        window.syncBranchSelection(name);
      }
    }
    if (s1Code) s1Code.value = code;

    lock(es, false);
    update();

    setTimeout(function () {
      look(es);
    }, 200);
  }

  if (branchInput) {
    branchInput.addEventListener('focus', function () {
      renderBranchOptions(branchInput.value);
    });

    branchInput.addEventListener('input', function () {
      renderBranchOptions(branchInput.value);
    });

    // Close branch dropdown on outside click
    document.addEventListener('click', function (e) {
      var wrap = branchInput.closest('.branch-autotype-wrap');
      if (wrap && !wrap.contains(e.target) && branchList) {
        branchList.classList.remove('open');
      }
    });
  }

  /* ==========================================================================
     5. ELIGIBILITY CONFIRMATION CHECKBOX
     ========================================================================== */
  if (el) {
    el.addEventListener('change', function () {
      // Sync with existing hidden checkbox if present
      var originalChk = document.getElementById('chk-eligibility-agreed');
      if (originalChk) originalChk.checked = el.checked;
      update();
    });
  }

  /* ==========================================================================
     6. CINEMATIC TYPEWRITER APPLICATION CREATION LOADER
     ========================================================================== */
  var loaderOverlay = $('#app-creation-loader');
  var terminalOutput = $('#terminal-output');

  function typeText(targetEl, text, speed) {
    return new Promise(function (resolve) {
      var idx = 0;
      var span = document.createElement('span');
      targetEl.appendChild(span);
      if (reduce) {
        span.textContent = text;
        resolve();
        return;
      }
      var t = setInterval(function () {
        if (idx < text.length) {
          span.textContent += text.charAt(idx);
          idx++;
        } else {
          clearInterval(t);
          resolve();
        }
      }, speed || 24);
    });
  }

  async function startTypewriterLoader(appNumber) {
    if (!loaderOverlay || !terminalOutput) return;

    loaderOverlay.classList.add('active');
    terminalOutput.innerHTML = '';

    var line1 = document.createElement('div');
    line1.className = 'term-line';
    terminalOutput.appendChild(line1);
    await typeText(line1, '> Initializing encrypted applicant enclave...', 10);

    await new Promise(function (r) { setTimeout(r, 80); });

    var line2 = document.createElement('div');
    line2.className = 'term-line';
    terminalOutput.appendChild(line2);
    await typeText(line2, '> Connecting to ledger node: ' + st.name + ' [' + st.code + ']...', 9);

    await new Promise(function (r) { setTimeout(r, 90); });

    var line3 = document.createElement('div');
    line3.className = 'term-line';
    terminalOutput.appendChild(line3);
    await typeText(line3, '> Creating your isolated banking application...', 10);

    await new Promise(function (r) { setTimeout(r, 110); });

    var line4 = document.createElement('div');
    line4.className = 'term-line highlight-app-line';
    terminalOutput.appendChild(line4);
    await typeText(line4, '> Application number is: ', 10);

    // Glowing Neon Application Reference Typed Letter-by-Letter
    var appSpan = document.createElement('span');
    appSpan.className = 'neon-app-number';
    line4.appendChild(appSpan);
    await typeText(appSpan, appNumber, 18);

    await new Promise(function (r) { setTimeout(r, 200); });

    var line5 = document.createElement('div');
    line5.className = 'term-line';
    terminalOutput.appendChild(line5);
    await typeText(line5, '> Provisioning uniform digital form... Success.', 10);

    await new Promise(function (r) { setTimeout(r, 250); });

    // Iris wipe transition into Step 2 Form
    var wipe = $('#wipe');
    if (wipe && !reduce) {
      var r = (go || document.body).getBoundingClientRect();
      wipe.style.setProperty('--x', (r.left + r.width / 2) + 'px');
      wipe.style.setProperty('--y', (r.top + r.height / 2) + 'px');
      wipe.classList.add('on');
    }

    setTimeout(function () {
      // Hide start hero & pinned stage
      var heroSec = $('#onboarding-hero-section');
      if (heroSec) heroSec.style.display = 'none';
      if (stage) stage.style.display = 'none';
      var pickSec = $('#start');
      if (pickSec) pickSec.style.display = 'none';
      var step1 = $('#onboarding-step-1');
      if (step1) step1.style.display = 'none';

      // Show Step 2 and unhide wizard section
      var wiz = $('#wizard-section');
      if (wiz) wiz.style.display = 'block';

      if (typeof window.goToOnboardingStep === 'function') {
        window.goToOnboardingStep(2);
      }
      var step2 = $('#onboarding-step-2');
      if (step2) step2.style.display = 'block';

      // Hide Loader & Wipe
      if (loaderOverlay) loaderOverlay.classList.remove('active');
      if (wipe) wipe.classList.remove('on');

      // Scroll to step 2 form smoothly
      var targetForm = $('#onboarding-step-2') || $('#wizard-section');
      if (targetForm) {
        targetForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, reduce ? 50 : 500);
  }

  if (go) {
    go.addEventListener('click', async function () {
      if (go.disabled) return;

      var branchName = st.name;
      var branchCode = st.code;

      try {
        var res = null;
        if (typeof window.api === 'function') {
          res = await window.api('/onboarding/initiate-draft', {
            method: 'POST',
            body: {
              accountType: st.type,
              branchName: branchName,
              branchCode: branchCode
            }
          });
        }

        var appNum = (res && res.applicationNumber) ? res.applicationNumber : ('APP-2026-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000));
        var secret = (res && res.draftSecret) ? res.draftSecret : '';

        window.currentApplicationNumber = appNum;
        window.currentDraftSecret = secret;
        try { sessionStorage.setItem('draft_secret_' + appNum, secret); } catch (_) {}

        // Update URL
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', '/open_account_customer/' + appNum);
        }

        // Sync header displays
        var toolbarApp = document.getElementById('toolbar-app-number');
        if (toolbarApp) toolbarApp.textContent = appNum;
        var headerApp = document.getElementById('header-app-number-display');
        if (headerApp) headerApp.textContent = appNum;
        var badge = document.getElementById('step2-selected-account-badge');
        if (badge) badge.textContent = st.type;

        // Trigger typewriter sequence
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
