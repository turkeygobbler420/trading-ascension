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
  var WHOP = { 'Trading Ascension Course': 'plan_zeK5g5GxH1eAb', 'Scalping Model': 'plan_FqiHg4UQcPmaN' };
  var whopUrl = function (plan) { var id = WHOP[key(plan)]; return id ? 'https://whop.com/checkout/' + id : ''; };
  window.addEventListener('pageshow', function (e) {
    var w = document.getElementById('go-whop'); if (w) w.remove();
    document.body.style.overflow = '';
    if (e.persisted && modal.classList.contains('open')) closeModal();
  });
  var EMBED = false;   // true = take payment inside the popup (Whop embedded checkout)
  var current = {};
  var loadWhop = function () {
    return new Promise(function (res, rej) {
      if (window.WhopElements) return res();
      var sc = document.createElement('script');
      sc.src = 'https://cdn.whop.com/elements/amber/elements.js'; sc.setAttribute('data-whop-elements', '');
      sc.onload = function () { window.WhopElements ? res() : rej(); }; sc.onerror = rej;
      document.head.appendChild(sc);
    });
  };
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
    var lp = document.getElementById('lead-pay'); if (lp) { lp.hidden = true; lp.innerHTML = ''; }
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
  // ---------- full-screen checkout page (Step 2) ----------
  var money = function (c) { return 'R' + Math.round(c / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var payPage = null, payHandle = null;
  var closePayPage = function () {
    if (!payPage) return;
    (Array.isArray(payHandle) ? payHandle : [payHandle]).forEach(function (h) { try { h && h.destroy && h.destroy(); } catch (_) {} });
    payHandle = null; payPage.remove(); payPage = null;
    document.body.style.overflow = ''; document.body.classList.remove('pay-open');
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (_) {}
  };
  var openPayPage = function (c) {
    closePayPage();
    var items = (PLANS[key(c.plan)] || []).map(function (i) { return '<li><b>' + esc(i[0]) + '</b>' + (i[1] ? ' <span>' + esc(i[1]) + '</span>' : '') + '</li>'; }).join('');
    var el = document.createElement('div');
    el.className = 'pay-page'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Checkout');
    el.innerHTML =
      '<header class="pp-top"><button type="button" class="pp-back" data-pp-close>&larr; Back</button><img class="pp-logo" src="assets/ta-logo.png" alt="Trading Ascension"></header>' +
      '<main class="pp-body">' +
        '<div class="pp-head"><h1>' + esc(c.plan) + '</h1><div class="pp-price">' + money(c.amount) + '</div></div>' +
        '<p class="pp-for">Once-off payment · access sent to ' + esc(c.email) + '</p>' +
        (items ? '<div class="pp-inc"><p>What you get</p><ul>' + items + '</ul></div>' : '') +
        '<div class="pp-express"><button type="button" class="pp-wallet">Pay with Apple Pay or Google Pay</button><div class="pp-or"><span>or pay by card</span></div></div>' +
        '<div class="pp-mount"><div class="pp-load">Loading checkout…</div></div>' +
        '<p class="pp-fine">Secure payment processed by Whop.</p>' +
      '</main>' +
      '<div class="pp-done" hidden><div class="pp-done-in"><div class="tick">✓</div><h2>Payment received, ' + esc(c.name.split(' ')[0]) + '</h2>' +
        '<p>Your access details are on the way to <b>' + esc(c.email) + '</b>. Check your inbox (and spam) in the next few minutes.</p>' +
        '<a class="btn" href="' + esc(c.wa) + '" target="_blank" rel="noopener">Message us on WhatsApp ↗</a><br><button type="button" class="link" data-pp-close>Back to site</button></div></div>';
    document.body.appendChild(el);
    payPage = el; document.body.classList.add('pay-open'); document.body.style.overflow = 'hidden';
    el.querySelectorAll('[data-pp-close]').forEach(function (b) { b.addEventListener('click', closePayPage); });
    requestAnimationFrame(function () { el.classList.add('in'); });
    var mount = el.querySelector('.pp-mount');
    var holder = document.createElement('div'); mount.appendChild(holder);
    var ready = function () { var l = mount.querySelector('.pp-load'); if (l) l.remove(); };
    if (window.MutationObserver) {   // hide the spinner as soon as Whop's form appears (onReady is not guaranteed)
      var mo = new MutationObserver(function () { var f = holder.querySelector('iframe'); if (f) { mo.disconnect(); f.addEventListener('load', ready); setTimeout(ready, 2500); } });
      mo.observe(holder, { childList: true, subtree: true });
    }
    return {
      mount: holder,
      wallet: el.querySelector('.pp-wallet'),
      setHandle: function (h) { payHandle = h; },
      ready: ready,
      success: function () { var d = el.querySelector('.pp-done'); d.hidden = false; requestAnimationFrame(function () { d.classList.add('in'); }); el.querySelector('.pp-body').setAttribute('aria-hidden', 'true'); }
    };
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && payPage) closePayPage(); });
  // ---------- save leads to Supabase (table: public.leads, insert-only) ----------
  var SUPABASE_URL = 'https://fbitbdhcimuiupptrwev.supabase.co';   // e.g. https://xxxx.supabase.co
  var SUPABASE_KEY = 'sb_publishable_90Vx7O7LI-JQVPZ6Zls43w_QLcfmvix';   // the public "anon" key (safe in the browser, RLS allows insert only)
  // TikTok attribution: remember the ad click (ttclid) for 90 days so the purchase can be tied back to this visitor
  var tiktokInfo = function () {
    var out = {};
    try {
      var qs = new URLSearchParams(location.search), st = JSON.parse(localStorage.getItem('ta_attr') || '{}');
      if (qs.get('ttclid')) { st.ttclid = qs.get('ttclid'); st.t = Date.now(); }
      if (qs.get('utm_source')) st.utm_source = qs.get('utm_source');
      if (st.t && Date.now() - st.t > 90 * 864e5) st = {};
      localStorage.setItem('ta_attr', JSON.stringify(st));
      var m = document.cookie.match(/(?:^|; )_ttp=([^;]+)/);
      out = { ttclid: st.ttclid || null, utm_source: st.utm_source || null, ttp: m ? decodeURIComponent(m[1]) : null, user_agent: navigator.userAgent.slice(0, 300) };
    } catch (_) {}
    return out;
  };
  tiktokInfo();   // run on landing so the click id is stored even before the form is opened
  var saveLead = function (row) {
    if (!SUPABASE_URL || !SUPABASE_KEY) return Promise.resolve();
    var req = fetch(SUPABASE_URL + '/rest/v1/leads', {
      method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY, Prefer: 'return=minimal' },
      body: JSON.stringify(row)
    }).catch(function () {});
    // never keep the buyer waiting more than 2 seconds
    return Promise.race([req, new Promise(function (res) { setTimeout(res, 2000); })]);
  };
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
    var url = current.amount ? whopUrl(lead.plan) : '';
    // lead_ref ties this exact form submission to the Whop payment (sent to Whop as checkout metadata)
    var ref = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
    var saved = saveLead(Object.assign({
      name: name, email: email, country_code: f.cc.value, whatsapp: phone, plan: lead.plan, lead_ref: ref,
      amount_zar: current.amount ? current.amount / 100 : null, page_url: location.href, status: url ? 'checkout_started' : 'new'
    }, tiktokInfo()));
    // No TikTok events are sent from the browser here. TikTok is only told about a purchase, by the server, after Whop confirms a successful payment.
    if (url && !EMBED) {
      // Hosted Whop checkout, with the buyer's email/name pre-filled so the payment matches this lead
      var go = url + '?email=' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name);
      modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
      var wait = document.createElement('div');
      wait.id = 'go-whop';
      wait.setAttribute('role', 'status');
      wait.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font:600 15px Inter,system-ui,sans-serif;color:#334155';
      wait.innerHTML = '<div style="width:34px;height:34px;border:3px solid #d1fae5;border-top-color:#16a34a;border-radius:50%;animation:gospin .8s linear infinite"></div><div>Opening secure checkout…</div><style>@keyframes gospin{to{transform:rotate(360deg)}}</style>';
      document.body.appendChild(wait);
      // Ask our server for a Whop link that carries this lead's reference (so the payment matches exactly,
      // and no personal data is in the URL). If that is unavailable, fall back to the pre-filled link above.
      saved.then(function () {
        var ctl = window.AbortController ? new AbortController() : null;
        var t = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
        return fetch(SUPABASE_URL + '/functions/v1/create-checkout', {
          method: 'POST', signal: ctl ? ctl.signal : undefined,
          headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY },
          body: JSON.stringify({ lead_ref: ref })
        }).then(function (r) { clearTimeout(t); return r.ok ? r.json() : null; })
          .then(function (j) { return j && /^https:\/\/whop\.com\//.test(j.url || '') ? j.url : go; });
      }).catch(function () { return go; }).then(function (dest) { window.location.href = dest; });
    } else if (url) {
      // Step 2: our own full-screen checkout page, with Whop's secure payment form embedded in it.
      // The payment carries our lead_ref so it matches this exact lead.
      modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'false'); modal.setAttribute('aria-hidden', 'true');
      var ctx = { plan: lead.plan, name: name, email: email, amount: current.amount, ref: ref, wa: document.getElementById('lead-wa').href };
      var pg = openPayPage(ctx);
      saved.then(loadWhop).then(function () {
        var c = window.WhopElements().checkout.create({
          plan: WHOP[key(lead.plan)],
          metadata: { lead_ref: ref },
          returnUrl: 'https://tradingascension.co.za/?checkout=return&ref=' + encodeURIComponent(ref),
          appearance: { classes: { 'whop-CheckoutDetails': { display: 'none' } } },   // our page shows the order summary
          onReady: function () { pg.ready(); },
          onComplete: function (r) { if (r && r.result === 'payment') pg.success(); }
        });
        // Big Apple Pay / Google Pay button: opens Whop's own checkout page, which offers both wallets
        pg.wallet.addEventListener('click', function () {
          pg.wallet.disabled = true; pg.wallet.textContent = 'Opening secure checkout…';
          var go = url + '?email=' + encodeURIComponent(email) + '&name=' + encodeURIComponent(name);
          fetch(SUPABASE_URL + '/functions/v1/create-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY }, body: JSON.stringify({ lead_ref: ref }) })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (j) { return j && /^https:\/\/whop\.com\//.test(j.url || '') ? j.url : go; })
            .catch(function () { return go; }).then(function (d) { window.location.href = d; });
        });
        pg.setHandle(c);
        c.create('checkout').mount(pg.mount);
      }).catch(function () { window.location.href = url; });
    } else { form.hidden = true; done.hidden = false; }
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
  // ---------- VSL player (rsaconsulting/Wistia-style: click to play, green bar with total time, chapter dots, time bubble that follows) ----------
  (function () {
    var v = document.getElementById('vsl'); if (!v) return;
    var box = v.parentNode;
    ['controls', 'autoplay', 'loop', 'muted'].forEach(function (a) { v.removeAttribute(a); });
    v.autoplay = false; v.loop = false; v.muted = false; v.defaultMuted = false; v.playsInline = true;
    if (!v.paused) v.pause();
    box.classList.add('tp', 'tp-idle');
    // chapters (seconds, title): the script sections of final_jali_vsl_v5 (2:37), each starting ~0.1 s before
    // its first spoken word (word times from a transcript of this file, cross-checked with the edit timeline)
    var CH = [
      [0, 'Why most beginners stall'],        // hook: "Have you ever wanted to learn to trade?"
      [10.1, 'What beginners are missing'],   // problem: "The problem is…" (10.20)
      [17.0, 'The Trading Ascension Model'],  // solution: "That's exactly why we created…" (17.08)
      [36.9, 'Meet Jali'],                    // story: "I'm Jali, the founder…" (36.98)
      [53.2, 'Helping SA traders'],           // "Over the past three years I've helped thousands of South Africans…" (53.26)
      [76.5, 'Student success stories'],      // proof: "And it's not just about my own journey." (76.58)
      [102.4, 'What you get inside'],         // offer: "So here's what you actually get…" (102.52)
      [139.9, 'Join Trading Ascension']       // cta: "If you've been wanting to learn how to trade…" (140.00)
    ];
    var I = {
      play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
      pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
      vol: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      mute: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
      more: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="18.5" cy="12" r="1.9"/></svg>',
      replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg>'
    };
    var fmt = function (s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); };
    var dur = function () { return isFinite(v.duration) && v.duration > 0 ? v.duration : 156.7; };
    var chAt = function (t) { var c = CH[0]; CH.forEach(function (x) { if (t >= x[0] - 0.05) c = x; }); return c; };
    var dots = CH.map(function (c, i) {
      return '<button class="tp-ch" type="button" data-t="' + c[0] + '" aria-label="Chapter ' + (i + 1) + ': ' + c[1] + '"></button>';
    }).join('');
    var list = CH.map(function (c) {
      return '<button type="button" class="tp-pop-ch" data-t="' + c[0] + '"><span>' + c[1] + '</span><em>' + fmt(c[0]) + '</em></button>';
    }).join('');
    box.insertAdjacentHTML('beforeend',
      '<button class="tp-big" type="button" aria-label="Play video">' + I.play + '</button>' +
      '<div class="tp-pop" role="menu">' +
        '<div class="tp-pop-h">Speed</div><div class="tp-speeds">' +
          [0.75, 1, 1.25, 1.5, 2].map(function (r) { return '<button type="button" data-r="' + r + '"' + (r === 1 ? ' class="on"' : '') + '>' + r + 'x</button>'; }).join('') +
        '</div><div class="tp-pop-h">Chapters</div>' + list +
      '</div>' +
      '<div class="tp-bar">' +
        '<button class="tp-btn tp-pp" type="button" aria-label="Play">' + I.play + '</button>' +
        '<span class="tp-dur"></span>' +
        '<div class="tp-seek" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0">' +
          '<div class="tp-track"><div class="tp-buf"></div><div class="tp-fill"></div></div>' +
          dots + '<div class="tp-head"></div>' +
          '<div class="tp-tip" aria-hidden="true"><span class="tp-tip-c"></span><span class="tp-tip-t">0:00</span></div>' +
        '</div>' +
        '<button class="tp-btn tp-vol" type="button" aria-label="Mute">' + I.vol + '</button>' +
        '<button class="tp-btn tp-fs" type="button" aria-label="Full screen">' + I.full + '</button>' +
        '<button class="tp-btn tp-more" type="button" aria-label="Speed and chapters" aria-haspopup="true">' + I.more + '</button>' +
        '<img class="tp-logo" src="assets/ta-mark.png" alt="" aria-hidden="true">' +
      '</div>');
    var q = function (s) { return box.querySelector(s); };
    var big = q('.tp-big'), pp = q('.tp-pp'), durEl = q('.tp-dur'), seek = q('.tp-seek'), fill = q('.tp-fill'),
        buf = q('.tp-buf'), head = q('.tp-head'), tip = q('.tp-tip'), tipT = q('.tp-tip-t'), tipC = q('.tp-tip-c'),
        vol = q('.tp-vol'), fs = q('.tp-fs'), more = q('.tp-more'), pop = q('.tp-pop');
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); return p; };
    var started = function () { return !box.classList.contains('tp-idle'); };
    var begin = function () { box.classList.remove('tp-idle'); play(); };
    var toggle = function () { if (!started()) { begin(); return; } if (v.paused || v.ended) { if (v.ended) v.currentTime = 0; play(); } else v.pause(); };
    var go = function (t) { v.currentTime = Math.min(Math.max(t, 0), dur() - 0.05); if (!started() || v.paused) begin(); paint(); };

    // the time bubble: follows the playhead, or the cursor while hovering/dragging the seek line
    var hoverT = null, drag = false;
    var place = function (t) {
      var w = seek.clientWidth, x = t / dur() * w, hw = tip.offsetWidth / 2;
      var cx = Math.min(Math.max(x, hw - 6), w - hw + 6);
      tipT.textContent = fmt(t); tipC.textContent = chAt(t)[1];
      tip.style.left = cx + 'px'; tip.style.setProperty('--ax', (x - cx) + 'px');
    };
    var paint = function () {
      var t = v.currentTime, p = Math.min(t / dur() * 100, 100);
      fill.style.width = p + '%'; head.style.left = p + '%';
      seek.setAttribute('aria-valuemax', Math.round(dur())); seek.setAttribute('aria-valuenow', Math.round(t));
      seek.setAttribute('aria-valuetext', fmt(t) + ' of ' + fmt(dur()) + ', ' + chAt(t)[1]);
      if (v.buffered.length) buf.style.width = Math.min(v.buffered.end(v.buffered.length - 1) / dur() * 100, 100) + '%';
      if (hoverT === null) place(t);
    };
    var setDur = function () { durEl.textContent = fmt(dur()); CH.forEach(function (c, i) { box.querySelectorAll('.tp-ch')[i].style.left = (c[0] / dur() * 100) + '%'; }); paint(); };
    setDur();
    ['loadedmetadata', 'durationchange'].forEach(function (e) { v.addEventListener(e, setDur); });
    ['timeupdate', 'progress', 'seeked'].forEach(function (e) { v.addEventListener(e, paint); });
    var raf = 0, loop = function () { paint(); raf = !v.paused ? requestAnimationFrame(loop) : 0; };

    var tAt = function (e) { var r = seek.getBoundingClientRect(); return Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * dur(); };
    var hover = function (e) {
      var c = !drag && e.target.closest && e.target.closest('.tp-ch');
      hoverT = c ? +c.getAttribute('data-t') : tAt(e);
      box.classList.add('tp-hov'); place(hoverT);
      if (drag) { v.currentTime = hoverT; paint(); }
    };
    var unhover = function () { hoverT = null; box.classList.remove('tp-hov'); paint(); };
    seek.addEventListener('pointermove', hover);
    seek.addEventListener('pointerleave', function () { if (!drag) unhover(); });
    seek.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.tp-ch')) return;
      drag = true; try { seek.setPointerCapture(e.pointerId); } catch (x) {}
      box.classList.add('tp-drag'); hover(e); go(hoverT);
    });
    var endDrag = function (e) { if (e.pointerType !== 'mouse') unhover(); if (!drag) return; drag = false; box.classList.remove('tp-drag'); wake(); };
    seek.addEventListener('pointerup', endDrag); seek.addEventListener('pointercancel', endDrag);
    box.querySelectorAll('.tp-ch').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); go(+b.getAttribute('data-t')); });
    });
    seek.addEventListener('keydown', function (e) {
      var d = { ArrowRight: 5, ArrowLeft: -5, ArrowUp: 5, ArrowDown: -5 }[e.key];
      if (e.key === 'Home') { e.preventDefault(); go(0); } else if (e.key === 'End') { e.preventDefault(); go(dur()); }
      else if (d) { e.preventDefault(); e.stopPropagation(); go(v.currentTime + d); }
    });

    var idle = 0, touch = matchMedia('(hover: none)').matches;
    var wake = function () {
      box.classList.add('tp-active'); clearTimeout(idle);
      // bar + time stamps fade out on their own while playing (sooner on touch screens)
      if (!v.paused) idle = setTimeout(function () {
        if (touch) { hoverT = null; box.classList.remove('tp-hov'); }
        if (!drag && !box.classList.contains('tp-hov') && !box.classList.contains('tp-menu')) box.classList.remove('tp-active');
      }, touch ? 1800 : 2200);
    };
    var state = function () {
      var playing = !v.paused && !v.ended;
      box.classList.toggle('tp-playing', playing);
      box.classList.toggle('tp-ended', v.ended);
      pp.innerHTML = playing ? I.pause : I.play; pp.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      big.innerHTML = v.ended ? I.replay : I.play; big.setAttribute('aria-label', v.ended ? 'Replay video' : 'Play video');
      if (playing && !raf) raf = requestAnimationFrame(loop);
      wake(); paint();
    };
    ['play', 'pause', 'ended'].forEach(function (e) { v.addEventListener(e, state); });
    big.addEventListener('click', toggle);
    pp.addEventListener('click', toggle);
    v.addEventListener('click', function () {
      if (box.classList.contains('tp-menu')) { closeMenu(); return; }
      // touch screens: while playing, the first tap only shows the controls
      if (!v.paused && matchMedia('(hover: none)').matches && !box.classList.contains('tp-active')) { wake(); return; }
      toggle();
    });
    box.addEventListener('mousemove', function () { if (!touch) wake(); });
    // mouse leaves the player: bar, time bubble and chapter label fall away (paused or playing), unless the menu is open
    box.addEventListener('mouseleave', function () {
      if (drag || box.classList.contains('tp-menu')) return;
      clearTimeout(idle); hoverT = null; box.classList.remove('tp-hov', 'tp-active'); paint();
    });
    box.addEventListener('touchstart', wake, { passive: true });
    var setVol = function () { vol.innerHTML = v.muted ? I.mute : I.vol; vol.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute'); };
    vol.addEventListener('click', function () { v.muted = !v.muted; setVol(); });
    fs.addEventListener('click', function () {
      var d = document;
      if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else if (box.requestFullscreen) box.requestFullscreen();
      else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
      else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen();   // iPhone
    });
    // "..." menu: playback speed + chapter list
    var closeMenu = function () { box.classList.remove('tp-menu'); more.setAttribute('aria-expanded', 'false'); wake(); };
    more.addEventListener('click', function (e) { e.stopPropagation(); var o = box.classList.toggle('tp-menu'); more.setAttribute('aria-expanded', o); wake(); });
    pop.addEventListener('click', function (e) {
      e.stopPropagation();
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-r')) {
        v.playbackRate = +b.getAttribute('data-r');
        pop.querySelectorAll('[data-r]').forEach(function (x) { x.classList.toggle('on', x === b); });
      } else { go(+b.getAttribute('data-t')); closeMenu(); }
    });
    document.addEventListener('click', function (e) { if (box.classList.contains('tp-menu') && !box.contains(e.target)) closeMenu(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.target.tagName === 'BUTTON' || e.target === seek) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(v.currentTime + (e.key === 'ArrowRight' ? 5 : -5)); }
    });
  })();
})();
