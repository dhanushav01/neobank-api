/**
 * NeoBank Authentication & Sign-in Engine
 * 3D Titanium Card Physics, Multi-Factor OTP / Password Flows, and Animated Transitions.
 */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scene = $('#scene');

  function toast(m) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.classList.remove('on'); }, 2800);
  }

  function shake(e) {
    if (!e) return;
    e.classList.remove('shake');
    void e.offsetWidth;
    e.classList.add('shake');
  }

  var EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var isMail = function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); };
  var isTel = function (v) { return /^\+?\d[\d\s-]{7,15}$/.test(v); };

  /* Icons */
  var IC = {
    "mail": '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3.5 7.5l8.5 6 8.5-6"/></svg>',
    "phone": '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="3"/><path d="M11 18.5h2"/></svg>',
    "lock": '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
    "user": '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5"/></svg>',
    "check": '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>'
  };

  function F(id, label, type, ic, auto, tid, eid, etid) {
    return '<div><div class="fld"><span class="fi">' + IC[ic] + '</span><input class="inp" id="' + id + '" type="' + type + '" placeholder=" " autocomplete="' + auto + '" data-testid="' + tid + '"><label for="' + id + '">' + label + '</label></div><p class="err" id="' + eid + '" data-testid="' + etid + '"></p></div>';
  }

  function AR(t) {
    return '<span>' + t + '</span><svg class="ar" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  }

  function otpPane(id, label, type, ic, first, sendTxt, verTxt) {
    return '<form class="tp" id="p-' + id + '" novalidate data-testid="login-' + id + '-form">' +
      '<ol class="stp" id="st-' + id + '"><li class="on"><b>1</b>' + first + '</li><li><b>2</b>Verify code</li></ol>' +
      F('i-' + id, label, type, ic, id === 'email' ? 'email' : 'tel', 'login-' + id + '-input', 'e-' + id, 'login-' + id + '-error-text') +
      '<button class="btn" type="button" id="s-' + id + '" data-testid="login-' + id + '-send-otp-button">' + AR(sendTxt) + '</button>' +
      '<div class="os" id="o-' + id + '" hidden style="display:grid;gap:16px">' +
      '<div class="badge" id="b-' + id + '" style="display:none">Demo code<b></b></div>' +
      '<div><span class="lb">6-digit one-time password</span><div class="otp" id="c-' + id + '" data-testid="login-' + id + '-otp-boxes"></div><p class="err" id="x-' + id + '"></p></div>' +
      '<div class="row"><span class="hint" id="r-' + id + '"></span><button type="button" class="lnk" id="rs-' + id + '" data-testid="login-' + id + '-resend-button">Resend code</button></div>' +
      '<button class="btn" type="submit" id="v-' + id + '" data-testid="login-' + id + '-verify-button">' + AR(verTxt) + '</button>' +
      '</div></form>';
  }

  var PANES = {
    email: otpPane('email', 'Email address', 'email', 'mail', 'Enter email', 'Send verification code', 'Verify &amp; open dashboard'),
    phone: otpPane('phone', 'Mobile phone number', 'tel', 'phone', 'Enter number', 'Send SMS code', 'Verify &amp; open dashboard'),
    pw: '<form class="tp" id="p-pw" novalidate data-testid="login-password-form">' +
      F('i-pw', 'Email or phone number', 'text', 'user', 'username', 'login-identifier-input', 'e-pw', 'login-identifier-error-text') +
      '<div><div class="fld hasEye"><span class="fi">' + IC.lock + '</span><input class="inp" id="pw1" type="password" placeholder=" " autocomplete="current-password" data-testid="login-password-input"><label for="pw1">Password</label><button type="button" class="eye" id="eye" aria-label="Show password" aria-pressed="false" data-testid="login-show-password-button">' + EYE + '</button></div><p class="err" id="e-pw2" data-testid="login-password-error-text"></p></div>' +
      '<div class="row"><span class="hint" id="caps" hidden>Caps Lock is on</span><button type="button" class="lnk" id="fgt" style="margin-left:auto" data-testid="login-forgot-link">Forgot password?</button></div>' +
      '<button class="btn" type="submit" id="go-pw" data-testid="login-submit-button">' + AR('Sign in &amp; open dashboard') + '</button></form>'
  };

  var CAP = {
    email: 'We’ll email you a 6-digit verification code.',
    phone: 'We’ll text you a 6-digit verification code.',
    pw: 'Use your registered email or phone and your password.'
  };

  var meth = 'email';

  function pane(m, anim) {
    meth = m;
    var cp = $('#cap');
    if (cp) {
      cp.textContent = CAP[m] || '';
      cp.style.animation = 'none';
      void cp.offsetWidth;
      cp.style.animation = '';
    }
    var panesEl = $('#panes');
    if (panesEl) {
      panesEl.innerHTML = PANES[m];
    }
    var tabsEl = $('#tabs');
    if (tabsEl) {
      tabsEl.style.setProperty('--t', ['email', 'phone', 'pw'].indexOf(m));
    }
    $$('.tab').forEach(function (t) {
      t.setAttribute('aria-selected', t.dataset.m === m);
    });
    if (panesEl) {
      $$('.otp', panesEl).forEach(boxes);
    }
    wire(m);
    if (!anim && panesEl && panesEl.firstChild) {
      panesEl.firstChild.style.animation = 'none';
    }
  }

  function boxes(el) {
    el.innerHTML = [1, 2, 3, 4, 5, 6].map(function (n) {
      return '<input maxlength="1" inputmode="numeric" autocomplete="one-time-code" aria-label="Digit ' + n + '">';
    }).join('');
  }

  function code(el) {
    return $$('input', el).map(function (i) { return i.value; }).join('');
  }

  /* OTP digit inputs management */
  document.addEventListener('input', function (e) {
    var t = e.target, o = t.closest('.otp');
    if (!o) return;
    t.value = t.value.replace(/\D/g, '').slice(-1);
    if (t.value) {
      t.classList.remove('pop');
      void t.offsetWidth;
      t.classList.add('pop');
      var n = t.nextElementSibling;
      if (n) n.focus();
    }
    o.classList.remove('bad');
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target, o = t.closest && t.closest('.otp');
    if (!o) return;
    if (e.key === 'Backspace' && !t.value && t.previousElementSibling) {
      t.previousElementSibling.value = '';
      t.previousElementSibling.focus();
    } else if (e.key === 'ArrowLeft' && t.previousElementSibling) {
      t.previousElementSibling.focus();
    } else if (e.key === 'ArrowRight' && t.nextElementSibling) {
      t.nextElementSibling.focus();
    }
  });

  document.addEventListener('paste', function (e) {
    var t = e.target, o = t.closest && t.closest('.otp');
    if (!o) return;
    e.preventDefault();
    var v = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    $$('input', o).forEach(function (i, n) {
      i.value = v[n] || '';
    });
  });

  /* Active OTP Storage and Countdown Timers */
  var SERVER_OTP = {}, tm = {};

  function wire(m) {
    if (m === 'pw') {
      var pw = $('#pw1');
      var eye = $('#eye');
      if (eye && pw) {
        eye.onclick = function () {
          var s = pw.type === 'password';
          pw.type = s ? 'text' : 'password';
          this.setAttribute('aria-pressed', s);
          this.setAttribute('aria-label', s ? 'Hide password' : 'Show password');
        };
      }
      if (pw && scene) {
        pw.addEventListener('focus', function () { scene.classList.add('flip'); });
        pw.addEventListener('blur', function () { scene.classList.remove('flip'); });
      }
      if (pw) {
        pw.addEventListener('keyup', function (e) {
          var caps = $('#caps');
          if (caps) caps.hidden = !(e.getModifierState && e.getModifierState('CapsLock'));
        });
      }
      var fgt = $('#fgt');
      if (fgt) fgt.onclick = openForgot;

      var formPw = $('#p-pw');
      if (formPw) {
        formPw.onsubmit = async function (e) {
          e.preventDefault();
          var id = $('#i-pw').value.trim();
          var p = pw.value;
          var ok = true;
          $('#e-pw').textContent = '';
          $('#e-pw2').textContent = '';

          if (!isMail(id) && !isTel(id)) {
            $('#e-pw').textContent = 'Enter a valid email address or phone number.';
            $('#i-pw').classList.add('bad');
            ok = false;
          } else {
            $('#i-pw').classList.remove('bad');
          }
          if (!p) {
            $('#e-pw2').textContent = 'Enter your password.';
            ok = false;
          }
          if (!ok) {
            shake($('#panel'));
            return;
          }

          var b = $('#go-pw');
          b.disabled = true;
          b.classList.add('dots');

          try {
            var res = await fetch('/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: id, password: p })
            });
            var data = await res.json();
            if (!res.ok) {
              throw new Error(data.message || data.detail || 'Invalid email or password.');
            }

            // Save authentication credentials
            if (data.accessToken) {
              localStorage.setItem('neobank_token', data.accessToken);
            }
            if (data.user) {
              localStorage.setItem('neobank_user', JSON.stringify(data.user));
            } else {
              localStorage.setItem('neobank_user', JSON.stringify({ email: id, role: data.role || 'CUSTOMER' }));
            }

            success(b, data.role);
          } catch (err) {
            b.disabled = false;
            b.classList.remove('dots');
            $('#e-pw2').textContent = err.message || 'Invalid email or password. Please try again.';
            shake($('#panel'));
            toast(err.message || 'Invalid email or password');
          }
        };
      }
      return;
    }

    var inp = $('#i-' + m), send = $('#s-' + m), os = $('#o-' + m);
    if (!inp || !send || !os) return;

    async function dosend() {
      var v = inp.value.trim();
      var okv = m === 'email' ? isMail(v) : isTel(v);
      if (!okv) {
        $('#e-' + m).textContent = m === 'email' ? 'Enter a valid email address.' : 'Enter a valid phone number.';
        inp.classList.add('bad');
        shake($('#panel'));
        return;
      }
      $('#e-' + m).textContent = '';
      inp.classList.remove('bad');
      send.disabled = true;
      send.classList.add('dots');

      try {
        var res = await fetch('/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: v })
        });
        var data = await res.json();

        send.classList.remove('dots');
        send.hidden = true;
        inp.disabled = true;
        os.hidden = false;
        var stpItems = $$('li', $('#st-' + m));
        if (stpItems[1]) stpItems[1].classList.add('on');

        // Check if server provided a test/demo OTP
        var demoCode = (data && (data.otp || data.demoOtp || data.code)) || '';
        if (demoCode) {
          SERVER_OTP[m] = String(demoCode);
          var badgeEl = $('#b-' + m);
          if (badgeEl) {
            badgeEl.style.display = 'block';
            var bEl = $('b', badgeEl);
            if (bEl) bEl.textContent = demoCode;
          }
        }

        if (scene) {
          scene.classList.add('ping');
          setTimeout(function () { scene.classList.remove('ping'); }, 2600);
        }

        var firstBox = $('input', $('#c-' + m));
        if (firstBox) firstBox.focus();
        count(m);
        toast('Verification code sent to ' + v);
      } catch (err) {
        send.disabled = false;
        send.classList.remove('dots');
        $('#e-' + m).textContent = 'Failed to dispatch verification code. Please try again.';
        shake($('#panel'));
      }
    }

    send.onclick = dosend;

    var resendBtn = $('#rs-' + m);
    if (resendBtn) {
      resendBtn.onclick = function () {
        dosend();
        $$('input', $('#c-' + m)).forEach(function (i) { i.value = ''; });
        var firstBox = $('input', $('#c-' + m));
        if (firstBox) firstBox.focus();
      };
    }

    var formOtp = $('#p-' + m);
    if (formOtp) {
      formOtp.onsubmit = async function (e) {
        e.preventDefault();
        if (os.hidden) {
          dosend();
          return;
        }
        var c = code($('#c-' + m)), b = $('#v-' + m);
        if (c.length < 6) {
          $('#x-' + m).textContent = 'Enter all six digits.';
          $('#c-' + m).classList.add('bad');
          shake($('#panel'));
          return;
        }
        $('#x-' + m).textContent = '';
        b.disabled = true;
        b.classList.add('dots');

        try {
          var res = await fetch('/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: inp.value.trim(), code: c })
          });
          var data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || data.detail || 'Invalid or expired OTP code.');
          }

          if (data.accessToken) {
            localStorage.setItem('neobank_token', data.accessToken);
          }
          if (data.user) {
            localStorage.setItem('neobank_user', JSON.stringify(data.user));
          } else {
            localStorage.setItem('neobank_user', JSON.stringify({ email: inp.value.trim(), role: data.role || 'CUSTOMER' }));
          }

          success(b, data.role);
        } catch (err) {
          b.disabled = false;
          b.classList.remove('dots');
          $('#x-' + m).textContent = err.message || 'Invalid or expired OTP code.';
          $('#c-' + m).classList.add('bad');
          shake($('#panel'));
        }
      };
    }
  }

  function count(m) {
    var n = 30, b = $('#rs-' + m), h = $('#r-' + m);
    if (!b || !h) return;
    clearInterval(tm[m]);
    b.disabled = true;
    h.textContent = 'Resend available in 30s';
    tm[m] = setInterval(function () {
      n--;
      if (n <= 0) {
        clearInterval(tm[m]);
        b.disabled = false;
        h.textContent = '';
      } else {
        h.textContent = 'Resend available in ' + n + 's';
      }
    }, 1000);
  }

  /* Success Transition & Dashboard Navigation */
  function success(btn, role) {
    var r = btn.getBoundingClientRect(), w = $('#wipe');
    if (scene) {
      scene.classList.remove('flip');
      scene.classList.add('flip', 'open');
    }
    var mlock = $('#mlock');
    if (mlock) {
      mlock.classList.add('open');
    }
    if (w) {
      w.style.setProperty('--x', (r.left + r.width / 2) + 'px');
      w.style.setProperty('--y', (r.top + r.height / 2) + 'px');
      setTimeout(function () { w.classList.add('on'); }, reduce ? 0 : 700);
    }

    var params = new URLSearchParams(window.location.search);
    var target = params.get('redirect') || '/app';
    if (target.includes('/sql-gui') && role === 'CUSTOMER') {
      target = '/app';
    }

    setTimeout(function () {
      window.location.href = target;
    }, reduce ? 350 : 2000);
  }

  /* Tabs Management */
  var tabsEl = $('#tabs');
  if (tabsEl) {
    tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.tab');
      if (b && b.dataset.m !== meth) pane(b.dataset.m, 1);
    });
    tabsEl.addEventListener('keydown', function (e) {
      var o = ['email', 'phone', 'pw'], i = o.indexOf(meth);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        var n = o[(i + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
        pane(n, 1);
        var tabBtn = $('#tab-' + n);
        if (tabBtn) tabBtn.focus();
      }
    });
  }

  /* Forgot Password Modal Workflow */
  var FD = '';
  function openForgot() {
    var modal = $('#modal');
    if (!modal) return;
    modal.hidden = false;
    $('#f1').hidden = false;
    $('#f2').hidden = true;
    $('#fe1').textContent = '';
    var inputIdent = $('#i-pw');
    var val = (inputIdent && inputIdent.value) ? inputIdent.value.trim() : '';
    var fid = $('#fid');
    if (fid) {
      fid.value = val;
      setTimeout(function () { fid.focus(); }, 60);
    }
  }

  function closeForgot() {
    var modal = $('#modal');
    if (modal) modal.hidden = true;
  }

  var fx2 = $('#fx2');
  if (fx2) fx2.onclick = closeForgot;
  var modalEl = $('#modal');
  if (modalEl) {
    modalEl.addEventListener('click', function (e) {
      if (e.target === this) closeForgot();
    });
  }
  document.addEventListener('keydown', function (e) {
    var modal = $('#modal');
    if (e.key === 'Escape' && modal && !modal.hidden) closeForgot();
  });

  var fo = $('#fo');
  if (fo) boxes(fo);

  var fsend = $('#fsend');
  if (fsend) {
    fsend.onclick = async function () {
      var fid = $('#fid');
      var v = fid ? fid.value.trim() : '';
      if (!isMail(v) && !isTel(v)) {
        $('#fe1').textContent = 'Enter a valid email address or phone number.';
        if (fid) fid.classList.add('bad');
        shake($('#modal .card'));
        return;
      }
      if (fid) fid.classList.remove('bad');
      fsend.disabled = true;
      fsend.classList.add('dots');

      try {
        var res = await fetch('/auth/forgot-password/request-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: v })
        });
        var data = await res.json();
        fsend.disabled = false;
        fsend.classList.remove('dots');

        var codeVal = (data && (data.otp || data.demoOtp || data.code)) || '';
        FD = String(codeVal || 100000 + Math.floor(Math.random() * 899999));
        var fc = $('#fc');
        if (fc) fc.textContent = FD;
        var ft = $('#ft');
        if (ft) ft.textContent = '✓ Verification code sent to ' + v;

        $('#f1').hidden = true;
        $('#f2').hidden = false;
        var firstBox = $('input', $('#fo'));
        if (firstBox) firstBox.focus();
      } catch (_) {
        fsend.disabled = false;
        fsend.classList.remove('dots');
        $('#fe1').textContent = 'Unable to send recovery code. Please check details.';
        shake($('#modal .card'));
      }
    };
  }

  var np = $('#np');
  if (np) {
    np.addEventListener('input', function () {
      var v = this.value;
      var sc = (v.length > 7) + (/[A-Z]/.test(v) && /[a-z]/.test(v)) + /\d/.test(v) + /[^A-Za-z0-9]/.test(v);
      var npm = $('#npm');
      if (npm) npm.style.width = (v ? Math.max(1, sc) * 25 : 0) + '%';
    });
  }

  var freset = $('#freset');
  if (freset) {
    freset.onclick = async function () {
      var e = $('#fe2');
      var c = code($('#fo')), a = $('#np').value, b = $('#cp').value;
      if (e) e.textContent = '';

      if (c.length < 6) {
        if (e) e.textContent = 'Enter the complete 6-digit code.';
        shake($('#modal .card'));
        return;
      }
      if (a.length < 8) {
        if (e) e.textContent = 'Use at least 8 characters for your new password.';
        shake($('#modal .card'));
        return;
      }
      if (a !== b) {
        if (e) e.textContent = 'The two passwords do not match.';
        shake($('#modal .card'));
        return;
      }

      freset.disabled = true;
      freset.classList.add('dots');

      try {
        var fid = $('#fid');
        var res = await fetch('/auth/forgot-password/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: fid ? fid.value.trim() : '', otp: c, newPassword: a })
        });
        var data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.detail || 'Invalid or expired OTP code.');
        }
        freset.disabled = false;
        freset.classList.remove('dots');
        closeForgot();
        toast('Password reset successfully! Please sign in.');
        pane('pw', 1);
        var pwInput = $('#pw1');
        if (pwInput) {
          pwInput.value = a;
          pwInput.focus();
        }
      } catch (err) {
        freset.disabled = false;
        freset.classList.remove('dots');
        if (e) e.textContent = err.message || 'Failed to reset password.';
        shake($('#modal .card'));
      }
    };
  }

  /* 3D Card Tilt with Pointer Interaction */
  var ti = $('#tilt');
  if (!reduce && matchMedia('(hover:hover)').matches && ti) {
    addEventListener('pointermove', function (e) {
      var x = e.clientX / innerWidth - .5;
      var y = e.clientY / innerHeight - .5;
      ti.style.setProperty('--ry', (x * 26) + 'deg');
      ti.style.setProperty('--rx', (-y * 18) + 'deg');
      ti.style.setProperty('--mx', (50 + x * 90) + '%');
      ti.style.setProperty('--my', (50 + y * 90) + '%');
    }, { passive: true });
  }

  /* Initial pane render */
  pane('email', 0);

  /* Synchronize phone lock badge state with scene state */
  var ml = $('#mlock');
  if (ml && scene) {
    new MutationObserver(function () {
      ml.className = 'mlock ' + scene.className.replace('scene', '').trim();
    }).observe(scene, { attributes: true, attributeFilter: ['class'] });
  }

  /* Dynamic Card Glow tracking */
  var panel = $('#panel');
  if (panel) {
    panel.addEventListener('pointermove', function (e) {
      var r = this.getBoundingClientRect();
      this.style.setProperty('--gx', ((e.clientX - r.left) / r.width * 100) + '%');
    });
  }

  /* Currents Background Canvas */
  if (!reduce) {
    var fxCanvas = $('#fx');
    if (fxCanvas) {
      var cx = fxCanvas.getContext('2d'), P = [], mx = -999, my = -999, W, H;
      function sp(p) {
        p.x = Math.random() * W;
        p.y = Math.random() * H;
        p.s = .6 + Math.random() * 1.1;
        p.h = Math.random() < .2;
        return p;
      }
      function sz() {
        var d = Math.min(devicePixelRatio || 1, 2);
        W = innerWidth;
        H = innerHeight;
        fxCanvas.width = W * d;
        fxCanvas.height = H * d;
        cx.setTransform(d, 0, 0, d, 0, 0);
        cx.fillStyle = '#04060b';
        cx.fillRect(0, 0, W, H);
        P = [];
        for (var i = 0; i < (W < 700 ? 40 : 100); i++) P.push(sp({}));
      }
      addEventListener('resize', sz);
      sz();
      addEventListener('pointermove', function (e) {
        mx = e.clientX;
        my = e.clientY;
      }, { passive: true });

      (function f(t) {
        requestAnimationFrame(f);
        if (document.hidden) return;
        cx.fillStyle = 'rgba(4, 6, 11, .09)';
        cx.fillRect(0, 0, W, H);
        P.forEach(function (p) {
          var a = Math.sin(p.x * .0028 + t * .00016) * 2.4 + Math.cos(p.y * .0035 - t * .00013) * 2.4;
          var d = Math.hypot(mx - p.x, my - p.y);
          if (d < 160) a += (1 - d / 160) * 2.2;
          var ox = p.x, oy = p.y;
          p.x += Math.cos(a) * p.s * 1.2;
          p.y += Math.sin(a) * p.s * 1.2;
          if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) { sp(p); return; }
          cx.strokeStyle = p.h ? 'rgba(0, 245, 155, .4)' : 'rgba(190, 215, 255, .12)';
          cx.beginPath();
          cx.moveTo(ox, oy);
          cx.lineTo(p.x, p.y);
          cx.stroke();
        });
      })(0);
    }
  }
})();
