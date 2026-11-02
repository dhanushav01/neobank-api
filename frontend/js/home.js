/**
 * NeoBank Landing Page Engine (open it, move it, freeze it)
 * Kinetic 3D card physics, flowing currents canvas, theme responsiveness,
 * and synchronized scroll storytelling.
 */

(function () {
  'use strict';

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var fmt = function (n) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  // Card Template Builder
  function cardHTML(id) {
    return (
      '<div class="card" id="' + id + 'Card">' +
        '<div class="face">' +
          '<div class="ln">NeoBank<span>Titanium</span></div>' +
          '<div class="ic" aria-hidden="true"></div>' +
          '<div class="num">4821 •••• •••• 8842</div>' +
          '<div class="bal">' +
            '<small>Available</small>' +
            '<strong data-testid="home-' + id + '-balance-text">$0.00</strong>' +
          '</div>' +
          '<div class="nm">Alexander V. Vance (sample)</div>' +
          '<div class="frost" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>' +
          '</div>' +
        '</div>' +
        '<div class="face back" aria-hidden="true">' +
          '<div class="strip"></div>' +
          '<p>Sample card for demos. No real funds.</p>' +
        '</div>' +
      '</div>'
    );
  }

  var heroScene = $('#heroScene');
  var stageScene = $('#stageScene');
  if (heroScene) heroScene.innerHTML = cardHTML('hero');
  if (stageScene) stageScene.innerHTML = cardHTML('stage');

  var heroCard = $('#heroCard');
  var stageCard = $('#stageCard');
  var heroBal = heroScene ? heroScene.querySelector('strong') : null;
  var stageBal = stageScene ? stageScene.querySelector('strong') : null;

  var BAL = 148920.5;
  if (stageBal) stageBal.textContent = fmt(BAL);

  /* Balance Count-Up Animation */
  function count() {
    if (!heroBal) return;
    var t0 = performance.now();
    var d = 1900;
    (function f(t) {
      var k = Math.min((t - t0) / d, 1);
      var e = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      heroBal.textContent = fmt(BAL * e);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }

  if (reduce) {
    if (heroBal) heroBal.textContent = fmt(BAL);
  } else {
    setTimeout(count, 900);
  }

  /* Flowing Currents Background Canvas */
  var cv = $('#fx');
  if (!cv) return;
  var c = cv.getContext('2d');
  var P = [];
  var mxp = -999;
  var myp = -999;

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ||
           document.body.classList.contains('light-theme');
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

  function spawn(p) {
    p.x = Math.random() * window.innerWidth;
    p.y = Math.random() * window.innerHeight;
    p.s = 0.6 + Math.random() * 1.2;
    p.h = Math.random() < 0.25;
    return p;
  }

  function step(t) {
    var light = isLightTheme();
    c.fillStyle = light ? 'rgba(245, 248, 252, 0.08)' : 'rgba(4, 6, 11, 0.07)';
    c.fillRect(0, 0, window.innerWidth, window.innerHeight);
    c.lineWidth = 1.1;

    for (var i = 0; i < P.length; i++) {
      var p = P[i];
      var a = Math.sin(p.x * 0.0028 + t * 0.00018) * 2.4 +
              Math.cos(p.y * 0.0035 - t * 0.00014) * 2.4;
      var d = Math.hypot(mxp - p.x, myp - p.y);
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

  // Smooth Hermite Interpolator
  function sm(a, b, x) {
    x = Math.min(Math.max((x - a) / (b - a), 0), 1);
    return x * x * (3 - 2 * x);
  }

  /* Pointer Tilt & Pinned Scroll Stage Engine */
  var tx = 0, ty = 0, cx = 0, cy = 0;
  var stage = $('#stage');
  var chaps = document.querySelectorAll('.chap');
  var sc = stage ? stage.querySelector('.pin') : null;
  var railFill = stage ? stage.querySelector('.rail i') : null;
  var sentPill = stage ? stage.querySelector('.sent') : null;
  var cur = -1;

  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth - 0.5;
    ty = e.clientY / window.innerHeight - 0.5;
    mxp = e.clientX;
    myp = e.clientY;
  }, { passive: true });

  function frame(t) {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;

    if (heroCard) {
      heroCard.style.setProperty('--ry', (cx * 26 + (reduce ? 0 : Math.sin(t / 1400) * 4)) + 'deg');
      heroCard.style.setProperty('--rx', (-cy * 18) + 'deg');
      heroCard.style.setProperty('--mx', (50 + cx * 90) + '%');
      heroCard.style.setProperty('--my', (50 + cy * 90) + '%');
    }

    if (stage && sc && stageCard) {
      var r = stage.getBoundingClientRect();
      var maxScroll = r.height - window.innerHeight;
      var p = maxScroll > 0 ? Math.min(Math.max(-r.top / maxScroll, 0), 1) : 0;

      sc.style.setProperty('--p', p);
      stage.style.setProperty('--p', p);
      if (railFill) railFill.style.height = (p * 100) + '%';

      var send = sm(0.36, 0.46, p) - sm(0.62, 0.70, p);
      stageCard.style.setProperty('--spin', (p * 360) + 'deg');
      stageCard.style.setProperty('--rx', (Math.sin(p * Math.PI * 2) * 9) + 'deg');
      stageCard.style.setProperty('--sc', 0.86 + 0.14 * sm(0, 0.15, p));
      stageCard.style.setProperty('--frost', sm(0.70, 0.88, p));
      stageCard.style.setProperty('--mx', (20 + p * 70) + '%');

      if (sentPill) sentPill.style.setProperty('--send', send);
      if (stageBal) stageBal.textContent = fmt(p > 0.5 ? BAL - 240 : BAL);

      var idx = p < 0.34 ? 0 : (p < 0.67 ? 1 : 2);
      if (idx !== cur) {
        cur = idx;
        chaps.forEach(function (el, k) {
          var isActive = (k === idx);
          el.classList.toggle('on', isActive);
          el.setAttribute('aria-hidden', !isActive);
        });
      }
    }

    if (!reduce && !document.hidden) {
      step(t);
    }

    if (!reduce) {
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener('resize', function () {
    size();
    if (reduce) frame(0);
  });

  // Listen for Theme Changes from NeobankTheme
  window.addEventListener('neobank:themechange', function () {
    size();
  });

  // Smooth Scroll to Explore Handler
  var exploreBtn = $('[data-testid="home-hero-explore-button"]');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', function (e) {
      var target = document.getElementById('start');
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (history.pushState) {
          history.pushState(null, '', '#start');
        }
      }
    });
  }

  size();

  if (reduce) {
    for (var k = 0; k < 140; k++) step(k * 16);
    frame(0);
    window.addEventListener('scroll', function () { frame(0); }, { passive: true });
  } else {
    requestAnimationFrame(frame);
  }
})();

