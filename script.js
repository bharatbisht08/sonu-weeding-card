/* ==========================================================================
   Sonu & Kajal — Wedding Invitation · main interactions
   ========================================================================== */
(function () {
  'use strict';

  const W = window.WEDDING;
  const I = window.I18N;
  const O = window.Ornaments;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const LANG_KEY = 'sk-wedding-lang';
  const FX_KEY = 'sk-wedding-fx';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let lang = 'en';
  let rendered = false;

  /* ------------------------------------------------------------ storage (session only) */
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* ------------------------------------------------------------ i18n helpers */
  const t = (key, l = lang) => {
    const dict = I[l] || I.en;
    return dict[key] !== undefined ? dict[key] : I.en[key];
  };
  const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  function dateText(full, l = lang) {
    if (!W.date) return full ? t('dateTBA', l) : t('tba', l);
    const d = new Date(W.date + 'T00:00:00');
    const ds = d.toLocaleDateString(t('locale', l), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `${ds} · ${t('muhuratLabel', l)}: ${W.muhurat || t('tba', l)}`;
  }

  /** Date and Muhurat as separate lines (used by the formal PDF card). */
  function dateParts(l = lang) {
    if (!W.date) return { date: t('tba', l), muhurat: '' };
    const d = new Date(W.date + 'T00:00:00');
    return {
      date: d.toLocaleDateString(t('locale', l), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      muhurat: `${t('muhuratLabel', l)}: ${W.muhurat || t('tba', l)}`,
    };
  }

  window.App = { t, dateText, dateParts, getLang: () => lang };

  /* ------------------------------------------------------------ ornaments */
  function renderOrnaments(root = document) {
    $$('.orn', root).forEach((el) => {
      const c = el.dataset.color;
      switch (el.dataset.orn) {
        case 'mandala': el.innerHTML = O.mandala(c || O.GOLD); break;
        case 'corner': el.innerHTML = O.corner(c || O.GOLD, +el.dataset.rot || 0); break;
        case 'divider': el.innerHTML = O.divider(c || O.GOLD); break;
        case 'kalash': el.innerHTML = O.kalash(c || O.GOLD); break;
        case 'car': el.innerHTML = O.car(); break;
        case 'toran': {
          const h = el.clientHeight || 70;
          const w = Math.max(700, Math.round((el.clientWidth || 1200) * (96 / h)));
          el.innerHTML = O.toran(w, Math.max(4, Math.round(w / 170)));
          break;
        }
      }
    });
  }

  /* ------------------------------------------------------------ wedding data → DOM */
  function applyWeddingData() {
    $$('[data-w]').forEach((el) => { const v = getPath(W, el.dataset.w); if (v != null) el.textContent = v; });
    $$('[data-href]').forEach((el) => { el.href = getPath(W, el.dataset.href); });
    $$('[data-tel]').forEach((el) => { el.href = window.telLink(getPath(W, el.dataset.tel)); });
    $$('[data-coords]').forEach((el) => { el.textContent = `${W.venue.lat}, ${W.venue.lng}`; });
    $$('[data-brothers-inline]').forEach((el) => { el.textContent = W.brothers.join(' · '); });
    if (!W.showInvocation) $$('[data-invocation]').forEach((el) => { el.hidden = true; });
  }

  /* ------------------------------------------------------------ dynamic lists */
  const RITUAL_ICONS = ['🌼', '🌿', '🎶', '🐎', '💐', '🔥'];
  const NOTE_STYLES = [
    ['#fff59d', '-2deg'], ['#ffccbc', '1.5deg'], ['#c8e6c9', '-1deg'],
    ['#f8bbd0', '2deg'], ['#b3e5fc', '-1.5deg'], ['#ffe0b2', '1deg'],
  ];
  const SIGN_STYLES = [
    ['#e53935', 'rgba(229,57,53,.55)'], ['#43a047', 'rgba(67,160,71,.55)'],
    ['#8e24aa', 'rgba(142,36,170,.6)'], ['#fb8c00', 'rgba(251,140,0,.55)'],
  ];
  const DEPT_GLOW = ['#ffd54f', '#ff8a65', '#ff4081', '#4fc3f7'];

  const initials = (name) =>
    name.replace(/^(Late\s+)?(Shri\s+)?/i, '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  const text = (tag, cls, txt) => { const n = el(tag, cls); n.textContent = txt; return n; };

  function markReveal(node, delay) {
    node.classList.add('reveal');
    if (delay) node.style.setProperty('--d', delay + 's');
    if (rendered) node.classList.add('is-in');
    else revealObserver && revealObserver.observe(node);
  }

  function renderLists() {
    // Rituals
    const rit = $('#rituals-list');
    rit.replaceChildren(...t('rituals').map((name, i) => {
      const li = el('li', 'ritual');
      li.append(text('span', 'ritual__medal', RITUAL_ICONS[i] || '✨'), text('span', 'ritual__name', name));
      li.firstChild.setAttribute('aria-hidden', 'true');
      return li;
    }));

    // Brothers
    const bro = $('#brothers-grid');
    bro.replaceChildren(...W.brothers.map((name, i) => {
      const card = el('article', 'fcard');
      const medal = text('div', 'fcard__medal', initials(name));
      medal.setAttribute('aria-hidden', 'true');
      card.append(medal, text('p', 'fcard__role', t('family.brother')), text('h4', 'fcard__name', name));
      markReveal(card, i * 0.08);
      return card;
    }));

    // Funny notes
    const notes = $('#fun-notes');
    notes.replaceChildren(...t('fun.messages').map((msg, i) => {
      const li = text('li', 'note', msg);
      const [bg, r] = NOTE_STYLES[i % NOTE_STYLES.length];
      li.style.setProperty('--bg', bg);
      li.style.setProperty('--r', r);
      markReveal(li, (i % 3) * 0.1);
      return li;
    }));

    // Excuse chips
    const chips = $('#excuse-chips');
    chips.replaceChildren(...t('fun.excuses').map((ex, i) => {
      const b = text('button', 'chip', ex.q);
      b.type = 'button';
      b.dataset.excuse = i;
      return b;
    }));
    $('#excuse-answer').textContent = '';

    // Journey stops
    const stops = t('map.stops');
    $('#journey-stops').replaceChildren(...stops.map((name, i) => {
      const last = i === stops.length - 1;
      const li = el('li', 'stop' + (last ? ' stop--dest' : ''));
      const pin = el('span', 'stop__pin', O.pin(last ? '#d4af37' : '#c62828', last ? '#7a1a2e' : '#fff'));
      pin.style.setProperty('--pd', i * 0.3 + 's');
      pin.setAttribute('aria-hidden', 'true');
      const label = i === 0 ? t('map.startLabel') : last ? t('map.destLabel') : '';
      const wrap = el('span');
      if (label) wrap.append(text('small', 'stop__label', label));
      wrap.append(text('span', 'stop__name', (last ? '💒 ' : '') + name));
      li.append(pin, wrap);
      if (last) { const ring = el('span', 'stop__ring'); ring.setAttribute('aria-hidden', 'true'); li.append(ring); }
      return li;
    }));

    // Department signs & cards
    $('#dept-signs').replaceChildren(...t('daru.signs').map((s, i) => {
      const d = el('div', 'sign');
      const [bg, glow] = SIGN_STYLES[i % SIGN_STYLES.length];
      d.style.setProperty('--sbg', bg);
      d.style.setProperty('--sglow', glow);
      d.style.setProperty('--sd', (i * -0.9) + 's');
      d.append(text('span', '', s));
      return d;
    }));
    $('#dept-cards').replaceChildren(...t('daru.cards').map((c, i) => {
      const card = el('article', 'dcard');
      card.style.setProperty('--glow', DEPT_GLOW[i % DEPT_GLOW.length]);
      const icon = text('div', 'dcard__icon', c.icon);
      icon.setAttribute('aria-hidden', 'true');
      icon.style.animationDelay = i * 0.4 + 's';
      card.append(icon, text('h3', 'dcard__title', c.title), text('p', 'dcard__text', c.text), text('p', 'dcard__joke', c.joke));
      if (c.tag) card.append(text('span', 'dcard__tag', c.tag));
      markReveal(card, i * 0.1);
      return card;
    }));
  }

  /* ------------------------------------------------------------ language */
  function applyLanguage(next) {
    if (!I[next]) next = 'en';
    lang = next;
    const root = document.documentElement;
    root.lang = t('htmlLang');
    root.dataset.lang = lang;

    $$('[data-i18n]').forEach((node) => {
      const v = t(node.dataset.i18n);
      if (typeof v === 'string') node.textContent = v;
    });
    $$('[data-i18n-attr]').forEach((node) => {
      node.dataset.i18nAttr.split(',').forEach((pair) => {
        const [attr, key] = pair.split(':').map((s) => s.trim());
        node.setAttribute(attr, t(key));
      });
    });
    $$('[data-date-text]').forEach((n) => { n.textContent = dateText(true); });
    $$('[data-date-short]').forEach((n) => { n.textContent = dateText(false); });
    $$('.lang-switch [data-set-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));

    renderLists();
    resetFunState();
    updateMap();
    store.set(LANG_KEY, lang);
  }

  function updateMap() {
    const frame = $('#venue-map');
    const src = `https://maps.google.com/maps?q=${W.venue.lat},${W.venue.lng}&z=15&hl=${t('mapHl')}&output=embed`;
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
  }

  /* ------------------------------------------------------------ opening: modal + doors */
  const mainRegions = () => [$('#main'), $('#nav'), $('.footer')];

  function showModal() {
    const modal = $('#lang-modal');
    modal.hidden = false;
    mainRegions().forEach((r) => r && r.setAttribute('inert', ''));
    setTimeout(() => { const first = $('.lang-card', modal); first && first.focus({ preventScroll: true }); }, 400);
  }

  function closeModal() {
    const modal = $('#lang-modal');
    if (modal.hidden) return Promise.resolve();
    mainRegions().forEach((r) => r && r.removeAttribute('inert'));
    modal.classList.add('is-closing');
    return new Promise((res) => setTimeout(() => { modal.hidden = true; modal.classList.remove('is-closing'); res(); }, 600));
  }

  function openDoors() {
    const doors = $('.doors');
    const finish = () => {
      doors.classList.add('is-gone');
      document.body.classList.remove('is-locked');
    };
    if (reduceMotion.matches || !doors) {
      document.body.classList.add('entered');
      finish();
      return;
    }
    requestAnimationFrame(() => {
      doors.classList.add('is-open');
      setTimeout(() => document.body.classList.add('entered'), 450);
      setTimeout(finish, 1600);
    });
  }

  /* ------------------------------------------------------------ nav */
  function initNav() {
    const nav = $('#nav');
    const menuBtn = $('#nav-menu');
    const links = $('#nav-links');
    const onScroll = () => nav.classList.toggle('nav--solid', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setMenu = (open) => {
      menuBtn.setAttribute('aria-expanded', String(open));
      links.classList.toggle('is-open', open);
    };
    menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  }

  /* ------------------------------------------------------------ reveal on scroll */
  let revealObserver = null;
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach((n) => n.classList.add('is-in'));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal').forEach((n) => revealObserver.observe(n));
  }

  /* ------------------------------------------------------------ effects (petals, hearts, sparkles, confetti) */
  const FX = (() => {
    const canvas = $('#fx-canvas');
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, raf = 0, running = false, last = 0;
    let particles = [];
    let confetti = [];
    const PETAL_COLORS = [['#c2185b', '#f8bbd0'], ['#d81b60', '#ffcdd2'], ['#ad1457', '#f48fb1'], ['#e65100', '#ffcc80']];
    const CONF_COLORS = ['#d4af37', '#f3d98b', '#ff4f81', '#ff8a00', '#7cffcb', '#c2185b', '#ffffff'];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const rand = (a, b) => a + Math.random() * (b - a);

    function spawn(initial) {
      const r = Math.random();
      const type = r < 0.55 ? 'petal' : r < 0.72 ? 'heart' : 'spark';
      const p = {
        type, x: rand(0, w), size: type === 'spark' ? rand(1.2, 2.8) : rand(6, 12),
        rot: rand(0, Math.PI * 2), vr: rand(-1.2, 1.2), sway: rand(0.4, 1.4), phase: rand(0, Math.PI * 2),
        alpha: type === 'spark' ? rand(0.5, 1) : rand(0.55, 0.85), color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      };
      if (type === 'petal') { p.y = initial ? rand(-h, h) : rand(-60, -20); p.vy = rand(22, 46); }
      else { p.y = initial ? rand(0, h) : h + rand(10, 40); p.vy = -rand(10, 26); }
      return p;
    }

    function drawPetal(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.phase * 1.3)) * 0.7 + 0.3);
      const g = ctx.createLinearGradient(0, -p.size, 0, p.size);
      g.addColorStop(0, p.color[0]); g.addColorStop(1, p.color[1]);
      ctx.fillStyle = g;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.7, p.size * 0.8, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.7, p.size * 0.8, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
      ctx.fill();
      ctx.restore();
    }
    function drawHeart(p) {
      const s = p.size;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.sin(p.phase) * 0.3);
      ctx.globalAlpha = p.alpha * 0.8;
      ctx.fillStyle = '#ff4f81';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(s, -s * 0.3, s * 0.5, -s, 0, -s * 0.45);
      ctx.bezierCurveTo(-s * 0.5, -s, -s, -s * 0.3, 0, s * 0.35);
      ctx.fill();
      ctx.restore();
    }
    function drawSpark(p) {
      ctx.save();
      ctx.globalAlpha = p.alpha * (0.55 + 0.45 * Math.sin(p.phase * 3));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      g.addColorStop(0, '#fff8dc'); g.addColorStop(0.3, '#f3d98b'); g.addColorStop(1, 'rgba(212,175,55,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += dt;
        p.y += p.vy * dt;
        p.x += Math.sin(p.phase * p.sway) * 18 * dt;
        p.rot += p.vr * dt;
        if (p.type === 'petal') { if (p.y > h + 30) particles[i] = spawn(false); drawPetal(p); }
        else { if (p.y < -30) particles[i] = spawn(false); p.type === 'heart' ? drawHeart(p) : drawSpark(p); }
      }
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i];
        c.vy += 900 * dt; c.vx *= 0.99; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; c.life -= dt;
        if (c.life <= 0 || c.y > h + 40) { confetti.splice(i, 1); continue; }
        ctx.save();
        ctx.translate(c.x, c.y); ctx.rotate(c.rot);
        ctx.globalAlpha = Math.min(1, c.life * 1.5);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.s / 2, -c.s / 4, c.s, c.s / 2);
        ctx.restore();
      }
      if (running || confetti.length) raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }

    function loop() {
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      const count = w < 640 ? 16 : w < 1100 ? 26 : 34;
      particles = Array.from({ length: count }, () => spawn(true));
      loop();
    }
    function stop() {
      running = false;
      particles = [];
      if (!confetti.length) { cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); }
    }
    function burst(x, y, n = 90) {
      if (reduceMotion.matches) return;
      for (let i = 0; i < n; i++) {
        const a = rand(-Math.PI, 0), v = rand(260, 620);
        confetti.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rot: rand(0, 6), vr: rand(-8, 8), s: rand(7, 12), life: rand(1.6, 2.6), color: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0] });
      }
      if (!running && confetti.length === n) loop();
    }

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (running || confetti.length) loop();
    });
    return { start, stop, burst, get running() { return running; } };
  })();

  function initFxToggle() {
    const btn = $('#fx-toggle');
    const saved = store.get(FX_KEY);
    let on = saved ? saved === 'on' : !reduceMotion.matches;
    const apply = () => {
      btn.setAttribute('aria-pressed', String(on));
      document.documentElement.classList.toggle('fx-off', !on);
      on ? FX.start() : FX.stop();
    };
    btn.addEventListener('click', () => { on = !on; store.set(FX_KEY, on ? 'on' : 'off'); apply(); });
    return apply;
  }

  /* ------------------------------------------------------------ toast */
  let toastTimer = 0;
  function toast(msg, isError = false) {
    const n = $('#toast');
    n.textContent = msg;
    n.classList.toggle('is-error', isError);
    n.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => n.classList.remove('is-show'), 2800);
  }

  async function copyText(str) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(str); return true; }
    } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = str; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  /* ------------------------------------------------------------ funny section */
  let dodges = 0;
  let excusesRejected = 0;
  let meterLevel = 0;

  function resetFunState() {
    const no = $('#rsvp-no');
    if (no) { no.classList.remove('is-dodging'); no.style.left = no.style.top = ''; }
    dodges = 0;
    const msg = $('#rsvp-msg'); if (msg) msg.textContent = '';
    setMeter(meterLevel, true);
  }

  function initFun() {
    const yes = $('#rsvp-yes');
    const no = $('#rsvp-no');
    const arena = $('#rsvp-arena');
    const msg = $('#rsvp-msg');
    const modal = $('#pass-modal');
    const closeBtn = $('#pass-close');
    let lastFocus = null;

    yes.addEventListener('click', () => {
      const r = yes.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, 110);
      $('#pass-no').textContent = '#' + String(101 + Math.floor(Math.random() * 899));
      const levels = t('fun.levels');
      $('#pass-level').textContent = levels[Math.floor(Math.random() * levels.length)];
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('is-locked');
      setTimeout(() => closeBtn.focus(), 50);
    });
    const closePass = () => {
      if (modal.hidden) return;
      modal.hidden = true;
      document.body.classList.remove('is-locked');
      msg.textContent = t('fun.passTitle');
      lastFocus && lastFocus.focus();
    };
    closeBtn.addEventListener('click', closePass);
    modal.addEventListener('click', (e) => { if (e.target === modal) closePass(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePass(); });

    // The "can't come" button runs away a few times before admitting defeat.
    const dodge = (e) => {
      if (dodges >= 4) return;
      if (e && e.cancelable) e.preventDefault();
      dodges++;
      const yr = yes.getBoundingClientRect();
      const ar = arena.getBoundingClientRect();
      no.classList.add('is-dodging');
      const maxX = Math.max(0, arena.clientWidth - no.offsetWidth);
      const maxY = Math.max(0, arena.clientHeight - no.offsetHeight);
      let x = 0, y = 0;
      for (let tries = 0; tries < 12; tries++) {
        x = Math.random() * maxX; y = Math.random() * maxY;
        const overlap = !(ar.left + x + no.offsetWidth < yr.left - 8 || ar.left + x > yr.right + 8 || ar.top + y + no.offsetHeight < yr.top - 8 || ar.top + y > yr.bottom + 8);
        if (!overlap) break;
      }
      no.style.left = x + 'px';
      no.style.top = y + 'px';
      const lines = t('fun.dodge');
      msg.textContent = lines[(dodges - 1) % lines.length];
    };
    no.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(e); });
    no.addEventListener('touchstart', dodge, { passive: false });
    no.addEventListener('click', () => {
      msg.textContent = t('fun.noCaught');
      dodges = 0;
      no.animate && !reduceMotion.matches && no.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }],
        { duration: 350, iterations: 2 });
    });

    // Excuse rejection counter
    $('#excuse-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-excuse]');
      if (!chip) return;
      const ex = t('fun.excuses')[+chip.dataset.excuse];
      const ans = $('#excuse-answer');
      ans.textContent = ex.a;
      ans.classList.remove('pop'); void ans.offsetWidth; ans.classList.add('pop');
      chip.classList.add('is-rejected');
      excusesRejected++;
      $('#excuse-count').textContent = excusesRejected;
    });

    // Barati energy meter
    $('#meter-btn').addEventListener('click', () => {
      if (meterLevel >= 4) { meterLevel = 0; setMeter(0); return; }
      meterLevel++;
      setMeter(meterLevel);
      if (meterLevel === 4) {
        const r = $('#meter-bar').getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top, 70);
      }
    });
  }

  function setMeter(level, silent) {
    const pct = level * 25;
    const bar = $('#meter-bar');
    if (!bar) return;
    $('#meter-fill').style.width = pct + '%';
    $('#meter-pct').textContent = pct + '%';
    bar.setAttribute('aria-valuenow', String(pct));
    const btn = $('#meter-btn');
    btn.textContent = level >= 4 ? t('daru.meterReset') : t('daru.meterBtn');
    const msg = $('#meter-msg');
    if (silent && level === 0) { msg.textContent = ''; return; }
    msg.textContent = level === 0 ? '' : level >= 4 ? t('daru.meterFull') : t('daru.meterSteps')[level - 1];
  }

  /* ------------------------------------------------------------ venue actions */
  function initVenue() {
    $('#copy-address').addEventListener('click', async () => {
      const ok = await copyText(`${W.venue.address} (${W.venue.lat}, ${W.venue.lng}) — ${W.venue.mapUrl}`);
      toast(ok ? t('map.copied') : W.venue.address, !ok);
    });
  }

  /* ------------------------------------------------------------ share */
  function initShare() {
    $('#share-btn').addEventListener('click', async () => {
      const data = { title: `${W.groom.name} & ${W.bride.name} · Wedding Invitation`, text: t('hero.tagline'), url: location.href };
      if (navigator.share) {
        try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const ok = await copyText(location.href);
      toast(ok ? t('footer.shared') : location.href, !ok);
    });
  }

  /* ------------------------------------------------------------ PDF buttons */
  function initPdf() {
    let busy = false;
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-pdf]');
      if (!btn || busy) return;
      busy = true;
      const overlay = $('#pdf-overlay');
      btn.setAttribute('aria-busy', 'true');
      overlay.hidden = false;
      try {
        await window.WeddingPDF.generate(btn.dataset.pdf, { lang });
        toast(t('dl.done'));
      } catch (err) {
        console.error(err);
        toast(t('dl.error'), true);
      } finally {
        overlay.hidden = true;
        btn.removeAttribute('aria-busy');
        busy = false;
      }
    });
  }

  /* ------------------------------------------------------------ boot */
  function init() {
    renderOrnaments();
    applyWeddingData();
    initReveal();
    initNav();
    initFun();
    initVenue();
    initShare();
    initPdf();
    const applyFx = initFxToggle();

    const saved = store.get(LANG_KEY);
    applyLanguage(saved && I[saved] ? saved : 'en');
    rendered = true;

    // Language buttons (modal cards + header switcher)
    document.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-set-lang]');
      if (!b) return;
      const fromModal = !!b.closest('#lang-modal');
      applyLanguage(b.dataset.setLang);
      if (fromModal) {
        await closeModal();
        openDoors();
        applyFx();
      } else {
        toast(t('langName'));
      }
    });

    if (saved && I[saved]) {
      openDoors();
      applyFx();
    } else {
      showModal();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
