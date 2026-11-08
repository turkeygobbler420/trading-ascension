(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var header = document.getElementById('site-header');
  var onScroll = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function tag(el, anim, delay) {
    el.classList.add('reveal');
    el.setAttribute('data-anim', anim);
    if (delay) el.style.setProperty('--d', delay + 'ms');
  }

  // text blocks
  $$('.eyebrow').forEach(function (e) { tag(e, 'fade'); });
  $$('h1,h2').forEach(function (e) { tag(e, 'fade', 80); });
  $$('.lead').forEach(function (e) { tag(e, 'rise', 160); });
  $$('.manifesto p').forEach(function (e, i) { tag(e, 'rise', i * 60); });
  $$('.fine,.principle,.contact p,footer .wrap > *').forEach(function (e) { tag(e, 'rise'); });
  $$('.pill').forEach(function (e) { tag(e, 'pop', 120); });
  $$('.video').forEach(function (e) { tag(e, 'zoom', 100); });
  $$('.win-card').forEach(function (e) { tag(e, 'rise-big'); });

  // grids: each child animates in turn, in its own style
  $$('.stats').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { tag(c, 'rise', i * 50); });
  });
  $$('.plans').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { tag(c, 'rise', i * 60); });
  });
  $$('.proofs').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { c.classList.add('proof-in'); });
  });
  $$('.faq details,.trust li').forEach(function (e, i) { tag(e, 'rise', (i % 5) * 50); });
  $$('.chips').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { tag(c, 'fade', i * 30); });
  });
  $$('.say').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (c, i) { tag(c, 'rise', i * 50); });
  });

  // list items inside a plan cascade in after the plan appears
  $$('.plan li').forEach(function (li, i) {
    var idx = $$('li', li.parentNode).indexOf(li);
    li.style.setProperty('--li', (350 + idx * 60) + 'ms');
  });

  // Reveal once, never re-hide. Re-hiding on leave plus event-only triggers left
  // cards at opacity 0 (dead space) whenever an observer callback was late or dropped
  // (fast swipes, address-bar resize, bfcache restore). Now a position sweep is the
  // source of truth: anything at or above the bottom of the screen is shown.
  var pending = $$('.reveal');
  var show = function (el) {
    if (el.classList.contains('visible')) return;
    el.classList.add('visible');
    setTimeout(function () { el.classList.add('done'); }, 1200);
  };
  var sweepQueued = false;
  var sweep = function () {
    sweepQueued = false;
    var edge = (window.innerHeight || document.documentElement.clientHeight) - 40;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < edge) { show(el); return false; }
      return true;
    });
  };
  var queue = function () {
    if (sweepQueued) return;
    sweepQueued = true;
    (window.requestAnimationFrame || setTimeout)(sweep);
  };
  ['scroll', 'resize', 'orientationchange', 'pageshow', 'load', 'touchmove', 'touchend', 'focus'].forEach(function (ev) {
    window.addEventListener(ev, queue, { passive: true });
  });
  document.addEventListener('visibilitychange', queue);
  document.addEventListener('DOMContentLoaded', queue);
  // safety net: keeps checking while anything is still hidden
  setInterval(function () { if (pending.length) sweep(); }, 400);
  sweep();
  if ('IntersectionObserver' in window) {
    var inObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); inObs.unobserve(e.target); } });
    }, { threshold: 0 });
    pending.forEach(function (el) { inObs.observe(el); });
  }

  // ---------- glyph background (hero) ----------
  var canvas = document.getElementById('glyphs');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentNode;
    var scrolling = false, scrollT = 0;
    window.addEventListener('scroll', function () { scrolling = true; clearTimeout(scrollT); scrollT = setTimeout(function () { scrolling = false; }, 180); }, { passive: true });
    var CELL = 20, PX = 3, cols, rows, cells, W, H, dpr, running = true;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var randGlyph = function () {
      var g = 0;
      for (var i = 0; i < 15; i++) if (Math.random() < 0.5) g |= (1 << i);
      return g;
    };
    var size = function () {
      dpr = 1;
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL); rows = Math.ceil(H / CELL);
      cells = [];
      for (var i = 0; i < cols * rows; i++) {
        var x = i % cols, y = (i / cols) | 0;
        var dx = (x * CELL - W / 2) / (W / 2), dy = (y * CELL - H / 2) / (H / 2);
        var r = Math.sqrt(dx * dx + dy * dy);
        var t = Math.min(Math.max((r - 0.5) / 0.6, 0), 1);
        cells.push({ g: randGlyph(), a: 0.04 + t * t * (3 - 2 * t) * 0.6, on: Math.random() < 0.55 });
      }
      draw();
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (!c.on) continue;
        ctx.fillStyle = 'rgba(22,163,74,' + (c.a * 0.5).toFixed(3) + ')';
        var ox = (i % cols) * CELL + 2, oy = ((i / cols) | 0) * CELL + 2;
        for (var b = 0; b < 15; b++) {
          if (c.g & (1 << b)) ctx.fillRect(ox + (b % 3) * (PX + 1), oy + ((b / 3) | 0) * (PX + 1), PX, PX);
        }
      }
    };
    var last = 0;
    var tick = function (t) {
      if (running && !scrolling && t - last > 200) {
        last = t;
        var n = Math.ceil(cells.length * 0.015);
        for (var k = 0; k < n; k++) {
          var c = cells[(Math.random() * cells.length) | 0];
          if (Math.random() < 0.6) c.g = randGlyph(); else c.on = !c.on;
        }
        draw();
      }
      if (!reduce) requestAnimationFrame(tick);
    };
    size();
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { running = en[0].isIntersecting; }).observe(hero);
    }
    if (!reduce) requestAnimationFrame(tick);
  }

  // ---------- lead popup ----------
  var modal = document.getElementById('lead-modal');
  var form = document.getElementById('lead-form');
  var done = document.getElementById('lead-done');
  var planField = document.getElementById('lead-plan');
  var lastFocus = null;
  
  
  var PLANS = {
    'Trading Ascension Course': [
      ['Full Trading Ascension Model video', 'Every lesson from trading foundations through to full execution, step by step.'],
      ['H1 bias + M5 execution', 'Set your direction on the H1, then take entries on the M5 only when your rules line up.'],
      ['Market structure and risk management', 'Read structure, set invalidation first and keep risk fixed on every trade.'],
      ['Psychology and journaling', 'Build the routine and the journal that keep you calm and consistent.'],
      ['Live group lectures', 'Learn alongside other students with live sessions and Q&A.'],
      ['Student portal and Discord access', 'Your Trading Ascension portal plus the student community and support channels.']
    ],
    'Trading Guide': [
      ['23-page beginner guide', 'A clear, plain-English walkthrough of how to read the market.'],
      ['Structure and risk basics', 'The foundations of market structure and keeping risk fixed.'],
      ['Trader\'s checklist', 'A simple checklist to run before every trade.']
    ],
    'Scalping Model': [
      ['Scalping Model video portal', 'Self-paced lessons covering the full Scalping Model.'],
      ['H1 bias and M5 entry', 'Find direction on the H1 and time your entry on the M5.'],
      ['BOS / MSS explanation and FVG / IFVG logic', 'What each signal means and exactly when it counts.'],
      ['Entry, invalidation and stop-loss rules', 'Know where you are wrong before you click.'],
      ['Entry checklist', 'A simple checklist to confirm every setup before you enter.'],
      ['General Discord', 'Join the student community and ask questions as you go.']
    ]
  };
  var key = function (plan) { return plan.replace(/ \(.*\)$/, ''); };
  // Whop plan IDs per product. Add the others when you have them.
  var WHOP = { 'Trading Ascension Course': 'plan_zeK5g5GxH1eAb' };
  var whopCo = null;
  var mountWhop = function (plan) {
    var el = document.getElementById('whop-checkout');
    var id = WHOP[key(plan)];
    if (whopCo && whopCo.destroy) { try { whopCo.destroy(); } catch (_) {} whopCo = null; }
    el.innerHTML = '';
    if (!id) { el.innerHTML = '<p class="co-note">Checkout for this programme is being set up. Email <a href="mailto:hello@tradingascension.co.za">hello@tradingascension.co.za</a> and we will sort your access.</p>'; return; }
    var tries = 0;
    (function go() {
      if (typeof window.WhopElements !== 'function') {
        if (++tries > 100) { el.innerHTML = '<p class="co-note">Checkout could not load. Please refresh and try again.</p>'; return; }
        return setTimeout(go, 100);
      }
      try {
        whopCo = window.WhopElements().checkout.create({ plan: id });
        whopCo.create('checkout').mount('#whop-checkout');
      } catch (err) { el.innerHTML = '<p class="co-note">Checkout could not load. Please refresh and try again.</p>'; }
    })();
  };
  var current = {};
  var resetPay = function () {
    var co = document.getElementById('checkout');
    if (co) { co.classList.remove('open'); co.setAttribute('aria-hidden', 'true'); }
  };
  var openModal = function (plan, btn) {
    lastFocus = document.activeElement;
    current = { amount: parseInt(btn && btn.getAttribute('data-amount'), 10) || 0, currency: (btn && btn.getAttribute('data-currency')) || 'zar' };
    planField.textContent = plan;
    resetPay();
    form.hidden = false; done.hidden = true; form.reset();
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { form.elements.name.focus(); }, 60);
  };
  var closeModal = function () {
    resetPay();
    modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };
  $$('[data-goto]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var t = document.getElementById(b.getAttribute('data-goto'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  $$('[data-lead]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openModal(b.getAttribute('data-lead'), b); });
  });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, ok = true;
    var name = f.name.value.trim(), email = f.email.value.trim(), phone = f.cc.value + ' ' + f.phone.value.trim();
    var digits = f.phone.value.replace(/[^\d]/g, '');
    [[f.name, name.length > 1], [f.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)], [f.phone, digits.length >= 6 && digits.length <= 13]].forEach(function (p) {
      p[0].classList.toggle('bad', !p[1]); if (!p[1]) ok = false;
    });
    if (!ok) return;
    var lead = { name: name, email: email, phone: phone, plan: planField.textContent, at: new Date().toISOString() };
    try {
      var all = JSON.parse(localStorage.getItem('ta_leads') || '[]'); all.push(lead);
      localStorage.setItem('ta_leads', JSON.stringify(all));
    } catch (_) {}
    var msg = 'Hi, I’m ' + name + ' (' + phone + '). I’d like to join: ' + lead.plan + '.';
    document.getElementById('lead-wa').href = 'https://wa.me/27000000000?text=' + encodeURIComponent(msg);
    document.getElementById('lead-name').textContent = name.split(' ')[0];
    form.hidden = true;
    if (current.amount) {
      // the form fades out and the checkout page transitions in
      mountWhop(lead.plan);
      modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
      checkout.classList.add('open'); checkout.setAttribute('aria-hidden', 'false');
    } else { done.hidden = false; }
  });

  // ---------- Whop embedded checkout ----------
  var checkout = document.getElementById('checkout');
  var closeCheckout = function (showDone) {
    checkout.classList.remove('open'); checkout.setAttribute('aria-hidden', 'true');
    if (whopCo && whopCo.destroy) { try { whopCo.destroy(); } catch (_) {} whopCo = null; }
    if (showDone) { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); form.hidden = true; done.hidden = false; }
    else { document.body.style.overflow = ''; }
  };
  document.getElementById('co-back').addEventListener('click', function () {
    closeCheckout(false); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); form.hidden = false;
  });

  // glass highlight follows the cursor
  $$('.win-card,.plan,.card,.video,.stat').forEach(function (el) {
    var raf = 0;
    el.addEventListener('pointermove', function (e) {
      if (raf) return; var cx = e.clientX, cy = e.clientY;
      raf = requestAnimationFrame(function () { raf = 0; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (cx - r.left) + 'px'); el.style.setProperty('--my', (cy - r.top) + 'px'); });
    });
  });
  $$('.marquee .lg img').forEach(function(i){function f(){var s=document.createElement('span');s.className='lgname';s.textContent=i.getAttribute('data-name');i.replaceWith(s);}i.addEventListener('error',f);if(i.complete&&!i.naturalWidth)f();});
})();