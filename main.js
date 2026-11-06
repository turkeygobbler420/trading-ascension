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
  $$('.btn').forEach(function (e) { tag(e, 'pop', 120); });
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
  $$('.faq details,.trust li,.logos .marquee').forEach(function (e, i) { tag(e, 'rise', (i % 5) * 50); });
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

  var items = $$('.reveal');
  var timers = new WeakMap();
  var show = function (el) {
    if (el.classList.contains('visible')) return;
    el.classList.add('visible');
    timers.set(el, setTimeout(function () { el.classList.add('done'); }, 1600));
  };
  var hide = function (el) {
    clearTimeout(timers.get(el));
    el.classList.remove('visible', 'done');
  };
  if ('IntersectionObserver' in window) {
    // play when an element comes into view (from either direction)...
    var inObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
    }, { threshold: 0.15, rootMargin: (window.innerWidth < 768 ? '0px 0px 120px 0px' : '0px 0px -60px') });
    // ...and rearm once it has fully left the screen, so it replays on the next pass
    var outObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (!e.isIntersecting) hide(e.target); });
    }, { threshold: 0 });
    items.forEach(function (el) { inObs.observe(el); outObs.observe(el); });
  } else {
    items.forEach(show);
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
  $$('[data-lead]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openModal(b.getAttribute('data-lead'), b); });
  });
  $$('[data-close]').forEach(function (b) { b.addEventListener('click', closeModal); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, ok = true;
    var name = f.name.value.trim(), surname = f.surname.value.trim(), phone = f.phone.value.trim();
    var digits = phone.replace(/[^\d]/g, '');
    [[f.name, name.length > 0], [f.surname, surname.length > 0], [f.phone, digits.length >= 9 && digits.length <= 15]].forEach(function (p) {
      p[0].classList.toggle('bad', !p[1]); if (!p[1]) ok = false;
    });
    if (!ok) return;
    var lead = { name: name, surname: surname, phone: phone, plan: planField.textContent, at: new Date().toISOString() };
    try {
      var all = JSON.parse(localStorage.getItem('ta_leads') || '[]'); all.push(lead);
      localStorage.setItem('ta_leads', JSON.stringify(all));
    } catch (_) {}
    var msg = 'Hi, I’m ' + name + ' ' + surname + ' (' + phone + '). I’d like to join: ' + lead.plan + '.';
    document.getElementById('lead-wa').href = 'https://wa.me/27000000000?text=' + encodeURIComponent(msg);
    document.getElementById('lead-name').textContent = name;
    form.hidden = true;
    if (current.amount) {
      // the form fades out and the checkout page transitions in
      var total = 'R' + (current.amount / 100).toLocaleString('en-ZA');
      document.getElementById('co-plan').textContent = lead.plan.replace(/ \(.*\)$/, '');
      document.getElementById('co-total').textContent = total;
      payBtn.textContent = 'Pay ' + total;
      modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
      checkout.classList.add('open'); checkout.setAttribute('aria-hidden', 'false');
    } else { done.hidden = false; }
  });

  // ---------- mock checkout (proof of concept) ----------
  var checkout = document.getElementById('checkout');
  var payBtn = document.getElementById('co-pay');
  var closeCheckout = function (showDone) {
    checkout.classList.remove('open'); checkout.setAttribute('aria-hidden', 'true');
    if (showDone) { modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); form.hidden = true; done.hidden = false; }
    else { document.body.style.overflow = ''; }
  };
  document.getElementById('co-back').addEventListener('click', function () {
    closeCheckout(false); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); form.hidden = false;
  });
  document.getElementById('co-skip').addEventListener('click', function () { closeCheckout(true); });
  $$('.co-m .co-row').forEach(function (r) {
    r.addEventListener('click', function () {
      $$('.co-m').forEach(function (m) { m.classList.remove('open'); m.querySelector('.co-row').setAttribute('aria-checked', 'false'); });
      r.parentNode.classList.add('open'); r.setAttribute('aria-checked', 'true');
    });
  });
  var digits = function (el, max, fmt) {
    el.addEventListener('input', function () { var v = el.value.replace(/\D/g, '').slice(0, max); el.value = fmt ? fmt(v) : v; });
  };
  digits(document.getElementById('co-num'), 16, function (v) { return v.replace(/(.{4})/g, '$1 ').trim(); });
  digits(document.getElementById('co-exp'), 4, function (v) { return v.length > 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v; });
  digits(document.getElementById('co-cvc'), 4);
  payBtn.addEventListener('click', function () {
    var card = document.querySelector('.co-m.open').getAttribute('data-m') === 'card';
    if (card) {
      var chk = [['co-num', 16], ['co-exp', 4], ['co-cvc', 3], ['co-fn', 0]], ok = true;
      chk.forEach(function (p) {
        var el = document.getElementById(p[0]), good = p[1] ? el.value.replace(/\D/g, '').length >= p[1] : el.value.trim().length > 0;
        el.classList.toggle('bad', !good); if (!good) ok = false;
      });
      if (!ok) return;
    }
    var t = payBtn.textContent; payBtn.textContent = 'Processing…'; payBtn.disabled = true;
    setTimeout(function () { payBtn.textContent = t; payBtn.disabled = false; closeCheckout(true); }, 1200);
  });

  // glass highlight follows the cursor
  $$('.win-card,.plan,.card,.video,.stat').forEach(function (el) {
    var raf = 0;
    el.addEventListener('pointermove', function (e) {
      if (raf) return; var cx = e.clientX, cy = e.clientY;
      raf = requestAnimationFrame(function () { raf = 0; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (cx - r.left) + 'px'); el.style.setProperty('--my', (cy - r.top) + 'px'); });
    });
  });
})();
