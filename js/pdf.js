/* ==========================================================================
   PDF CARDS — two downloadable A4 invitations, each in EN / HI / Bhojpuri:

     family  : formal card + "Family & Venue" page     (for elders & relatives)
     friends : party card  + "Barati Guide" page       (for friends)

   HOW THE PDFs ARE PRODUCED
   1. Pre-built (preferred): `npm run build:pdfs` prints these same layouts with
      Chrome's own PDF engine → vector text, embedded fonts, perfect Hindi /
      Bhojpuri shaping, clickable links, small files. They live in /pdfs and
      /pdfs/manifest.js records a signature of config + translations.
   2. Live fallback: if the pre-built files are missing or out of date (e.g.
      config.js was edited and the build wasn't re-run) or the site is opened
      via file://, the card is generated in the browser with html2canvas + jsPDF.
   ========================================================================== */
(function () {
  const W = window.WEDDING;
  const O = window.Ornaments;
  const LAYOUT_VERSION = 5; // bump when page layouts change, so old pre-built PDFs are not served
  const A4 = { w: 794, h: 1123, mmW: 210, mmH: 297 };
  const SCALE = 2;
  const LIBS = ['vendor/html2canvas.min.js', 'vendor/jspdf.umd.min.js', 'vendor/qrcode.js', 'assets/images/photos-data.js'];
  const FILE_LANG = { en: 'English', hi: 'Hindi', bh: 'Bhojpuri' };
  const TYPE_NAME = { family: 'Family-Relatives', friends: 'Friends' };

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = (p) => window.telLink(p);
  /** Real anchor (clickable in Chrome-printed PDFs) + data-link (used by the jsPDF fallback). */
  const link = (url, cls, inner) => `<a class="${cls}" href="${esc(url)}" data-link="${esc(url)}">${inner}</a>`;

  /* ------------------------------------------------------------ identity */
  function signature() {
    const str = JSON.stringify([LAYOUT_VERSION, W, window.I18N]);
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return LAYOUT_VERSION + '-' + h.toString(36) + '-' + str.length.toString(36);
  }
  const staticKey = (type, lang, special) => `${type}${special ? '-special' : ''}-${lang}`;
  const fileName = (type, lang) => `Sonu-Kajal-Wedding-Invitation-${TYPE_NAME[type]}-${FILE_LANG[lang] || lang}.pdf`;
  const pdfTitle = (type) => `${W.groom.name} & ${W.bride.name} — Wedding Invitation (${type === 'family' ? 'Family & Relatives' : 'Friends'})`;

  /* ------------------------------------------------------------ loaders */
  const loading = {};
  function loadScript(src) {
    if (loading[src]) return loading[src];
    loading[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete loading[src]; reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
    return loading[src];
  }
  const ensureLibs = () => Promise.all(LIBS.map(loadScript));
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

  async function ensureFonts() {
    if (!document.fonts) return;
    const latin = ['700 20px Cinzel', '400 40px "Great Vibes"', '500 20px "Cormorant Garamond"', '600 20px "Cormorant Garamond"', 'italic 500 20px "Cormorant Garamond"', '400 20px Mukta', '600 20px Mukta', '700 20px Mukta', '800 20px Mukta'];
    const deva = ['400 20px "Tiro Devanagari Hindi"', '400 20px "Yatra One"', '400 20px Mukta', '600 20px Mukta', '700 20px Mukta', '800 20px Mukta'];
    const jobs = [
      ...latin.map((f) => document.fonts.load(f, 'Aa&1')),
      ...deva.map((f) => document.fonts.load(f, 'शुभ विवाह')),
    ];
    await withTimeout(Promise.allSettled(jobs).then(() => document.fonts.ready), 8000);
  }

  /** Rasterise an SVG string to PNG (safest input for html2canvas on every browser). */
  const rasterCache = new Map();
  function raster(svg, w, h) {
    const key = w + 'x' + h + ':' + svg;
    if (rasterCache.has(key)) return rasterCache.get(key);
    const sized = svg.replace('<svg ', `<svg width="${w}" height="${h}" `);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = Math.round(w * SCALE);
          c.height = Math.round(h * SCALE);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/png'));
        } catch (e) { resolve(O.uri(sized)); }
      };
      img.onerror = () => resolve(O.uri(sized));
      img.src = O.uri(sized);
    });
    rasterCache.set(key, p);
    return p;
  }

  /** mode 'print' → vector SVGs (Chrome PDF); mode 'canvas' → PNGs (html2canvas). */
  async function buildAssets(mode) {
    const maroon = '#7a1a2e';
    const svgs = {
      mandala: [O.mandala(O.GOLD, 0.8), 600, 600],
      mandalaMaroon: [O.mandala(maroon, 0.8), 600, 600],
      divider: [O.divider(O.GOLD), 320, 32],
      dividerMaroon: [O.divider(maroon), 320, 32],
      toran: [O.toran(1000, 6), 1000, 96],
      kalash: [O.kalash(), 80, 90],
      pin: [O.pin('#c62828'), 30, 40],
      pinGold: [O.pin('#d4af37', '#7a1a2e'), 30, 40],
      car: [O.car(), 44, 76],
      g0: [O.corner(O.GOLD, 0), 160, 160], g1: [O.corner(O.GOLD, 90), 160, 160],
      g2: [O.corner(O.GOLD, 180), 160, 160], g3: [O.corner(O.GOLD, 270), 160, 160],
      p0: [O.corner('#c2185b', 0), 160, 160], p1: [O.corner('#c2185b', 90), 160, 160],
      p2: [O.corner('#c2185b', 180), 160, 160], p3: [O.corner('#c2185b', 270), 160, 160],
    };
    const a = {};
    await Promise.all(Object.entries(svgs).map(async ([k, [svg, w, h]]) => {
      a[k] = mode === 'print' ? O.uri(svg) : await raster(svg, w, h);
    }));
    const qr = window.qrcode(0, 'M');
    qr.addData(W.venue.mapUrl);
    qr.make();
    a.qrVenue = mode === 'print' ? O.uri(qr.createSvgTag(4, 2)) : qr.createDataURL(8, 2);
    const photos = window.WEDDING_PHOTOS || {};
    a.groom = mode === 'print' ? W.groom.photo : photos.groom || W.groom.photo;
    a.bride = mode === 'print' ? W.bride.photo : photos.bride || W.bride.photo;
    a.gold = [a.g0, a.g1, a.g2, a.g3];
    a.pink = [a.p0, a.p1, a.p2, a.p3];
    return a;
  }

  /* ------------------------------------------------------------ shared pieces */
  const corners = (set) =>
    ['tl', 'tr', 'br', 'bl'].map((pos, i) => `<img class="pdf-corner pdf-corner--${pos}" src="${set[i]}" alt="">`).join('');
  const initials = (n) => n.replace(/^(Late\s+)?(Shri\s+)?/i, '').split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const photos = (a, cls = '') => `
    <div class="pdf-photos ${cls}">
      <div class="pdf-photo" style="background-image:url('${a.groom}')"></div>
      <span class="pdf-heart">❤</span>
      <div class="pdf-photo" style="background-image:url('${a.bride}')"></div>
    </div>`;
  const route = (t, a) => {
    const stops = t('map.stops');
    return `
      <div class="pdf-route">
        <div class="pdf-route__road"><i></i></div>
        <img class="pdf-route__car" src="${a.car}" alt="">
        ${stops.map((s, i) => `
          <div class="pdf-route__stop ${i === stops.length - 1 ? 'is-dest' : ''}">
            <img src="${i === stops.length - 1 ? a.pinGold : a.pin}" alt="">
            <span>${esc(s)}</span>
          </div>`).join('')}
      </div>`;
  };
  const venueBox = (t, a) => `
      <div class="pdf-venue">
        <div class="pdf-venue__text">
          <h4>💒 ${esc(t('map.venueTitle'))}</h4>
          <p class="pdf-venue__addr">${esc(W.venue.address)}</p>
          <p class="pdf-venue__coords">${esc(t('map.coords'))}: ${W.venue.lat}, ${W.venue.lng}</p>
          <p class="pdf-venue__links">
            ${link(W.venue.mapUrl, 'pdf-link pdf-link--dark', '📍 ' + esc(t('pdf.tapMap')))}
            ${link(W.venue.directionsUrl, 'pdf-link pdf-link--dark', '🧭 ' + esc(t('pdf.tapDirections')))}
          </p>
          <p class="pdf-venue__note">${esc(t('pdf.routeNote'))}</p>
        </div>
        ${link(W.venue.mapUrl, 'pdf-qr pdf-qr--dark', `<img src="${a.qrVenue}" alt=""><span>${esc(t('pdf.scan'))}</span>`)}
      </div>`;

  /* ------------------------------------------------------------ FAMILY · page 1: formal card */
  function formalCard(t, a, dateText, lang) {
    return `
    <section class="pdf-page pdf-page--royal">
      <img class="pdf-mandala" src="${a.mandala}" alt="">
      <div class="pdf-frame"></div><div class="pdf-frame pdf-frame--inner"></div>
      ${corners(a.gold)}
      <img class="pdf-toran" src="${a.toran}" alt="">
      <div class="pdf-content pdf-content--royal">
        <div class="pdf-group">
          <img class="pdf-kalash" src="${a.kalash}" alt="">
          ${W.showInvocation ? `<p class="pdf-invocation">${esc(t('invocation'))}</p>` : ''}
          <h1 class="pdf-title">${esc(t('official.cardTitle'))}</h1>
          <img class="pdf-divider" src="${a.divider}" alt="">
          <p class="pdf-memory">${esc(t('official.memory'))} <b>${esc(W.grandfather.name)}</b></p>
        </div>
        ${photos(a)}
        <div class="pdf-group">
          <p class="pdf-text">${esc(t('official.opening'))}</p>
          <p class="pdf-name">${esc(W.groom.name)}</p>
          <p class="pdf-rel"><span>${esc(t('official.sonOf'))} <b>${esc(W.father.name)}</b></span><i>✦</i><span>${esc(t('official.grandsonOf'))} <b>${esc(W.grandfather.name)}</b></span></p>
          <p class="pdf-with">${esc(t('official.with'))}</p>
          <p class="pdf-name">${esc(W.bride.name)}</p>
          <p class="pdf-text">${esc(t('official.closing'))}</p>
        </div>
        <div class="pdf-group">
          <img class="pdf-divider" src="${a.divider}" alt="">
          <div class="pdf-info">
            <div class="pdf-info__boxes">
              <div class="pdf-box pdf-box--wide"><h4>${esc(t('official.dateLabel'))}</h4>${(() => {
                const d = window.App.dateParts(lang);
                return `<p class="pdf-date">${esc(d.date)}</p>${d.muhurat ? `<p>${esc(d.muhurat)}</p>` : ''}`;
              })()}</div>
              <div class="pdf-box pdf-box--wide"><h4>${esc(t('official.venueLabel'))}</h4><p>${esc(W.venue.address)}</p>
                <p>${link(W.venue.mapUrl, 'pdf-link', esc(t('pdf.tapMap')))}</p></div>
              <div class="pdf-box"><h4>${esc(t('official.residenceLabel'))}</h4><p>${esc(W.residence)}</p></div>
              <div class="pdf-box"><h4>${esc(t('official.contactLabel'))}</h4>
                <p>${link(tel(W.groom.phone), 'pdf-link', esc(W.groom.phone))} <small>(${esc(W.groom.short)})</small></p>
                <p>${link(tel(W.father.phone), 'pdf-link', esc(W.father.phone))} <small>(${esc(W.father.short)})</small></p></div>
            </div>
            ${link(W.venue.mapUrl, 'pdf-qr', `<img src="${a.qrVenue}" alt=""><span>${esc(t('pdf.scan'))}</span>`)}
          </div>
        </div>
        <div class="pdf-awaiting">
          <h4>${esc(t('official.awaiting'))}</h4>
          <p><b>${esc(W.father.name)}</b> ${esc(t('official.familyLine'))}</p>
          <h4>${esc(t('official.eager'))}</h4>
          <p>${W.brothers.map(esc).join(' · ')}</p>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ FAMILY · page 2: family & venue */
  function familyVenuePage(t, a) {
    const member = (medal, role, name, phone, cls = '') => `
      <div class="pdf-member ${cls}">
        <div class="pdf-member__medal">${medal}</div>
        <p class="pdf-member__role">${esc(role)}</p>
        <p class="pdf-member__name">${esc(name)}</p>
        ${phone ? link(tel(phone), 'pdf-member__phone', '📞 ' + esc(phone)) : ''}
      </div>`;
    return `
    <section class="pdf-page pdf-page--cream">
      <img class="pdf-mandala pdf-mandala--faint" src="${a.mandalaMaroon}" alt="">
      <div class="pdf-frame pdf-frame--maroon"></div><div class="pdf-frame pdf-frame--inner pdf-frame--maroon"></div>
      ${corners(a.gold)}
      <div class="pdf-content pdf-content--cream">
        <div class="pdf-group">
          <p class="pdf-kicker">${esc(t('family.sub'))}</p>
          <h2 class="pdf-h2">${esc(t('family.title'))}</h2>
          <img class="pdf-divider" src="${a.dividerMaroon}" alt="">
          <div class="pdf-tree">
            ${member('🪔', t('family.grandfather'), W.grandfather.name, null, 'pdf-member--memory')}
            ${member(esc(initials(W.father.name)), t('family.father'), W.father.name, W.father.phone)}
            ${member(`<span class="pdf-member__photo" style="background-image:url('${a.groom}')"></span>`, t('family.groom'), W.groom.name, W.groom.phone, 'pdf-member--groom')}
          </div>
          <h3 class="pdf-h3">${esc(t('pdf.brothersFormal'))}</h3>
          <div class="pdf-brothers">
            ${W.brothers.map((b) => member(esc(initials(b)), t('family.brother'), b, null, 'pdf-member--small')).join('')}
          </div>
          <p class="pdf-residence">🏠 <b>${esc(t('family.residence'))}:</b> ${esc(W.residence)}</p>
        </div>
        <div class="pdf-group">
          <img class="pdf-divider" src="${a.dividerMaroon}" alt="">
          <h2 class="pdf-h2">${esc(t('pdf.venueFormal'))}</h2>
          ${route(t, a)}
          ${venueBox(t, a)}
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ FRIENDS · page 1: party card */
  function friendsCard(t, a, dateText) {
    const colors = ['#fff59d', '#ffccbc', '#c8e6c9', '#f8bbd0', '#b3e5fc', '#ffe0b2'];
    return `
    <section class="pdf-page pdf-page--fun">
      <div class="pdf-frame pdf-frame--fun"></div>
      ${corners(a.pink)}
      <img class="pdf-toran pdf-toran--fun" src="${a.toran}" alt="">
      <div class="pdf-content pdf-content--fun">
        <div class="pdf-group">
          <p class="pdf-kicker pdf-kicker--fun">${esc(t('fun.kicker'))}</p>
          <h1 class="pdf-fun-title">${esc(t('fun.title'))}</h1>
          <p class="pdf-fun-sub">${esc(t('fun.sub'))}</p>
          <span class="pdf-stamp">${esc(t('fun.stamp'))}</span>
        </div>
        <div class="pdf-group">
          ${photos(a, 'pdf-photos--fun')}
          <p class="pdf-fun-names">${esc(W.groom.name)} <span>&amp;</span> ${esc(W.bride.name)}</p>
          <p class="pdf-fun-line">${esc(t('pdf.friendsLine'))}</p>
        </div>
        <div class="pdf-notes">
          ${t('fun.messages').map((n, i) => `<div class="pdf-note" style="background:${colors[i % colors.length]}">${esc(n)}</div>`).join('')}
        </div>
        <div class="pdf-fun-footer">
          <div class="pdf-fun-footer__text">
            <p><b>📅 ${esc(t(window.WEDDING.date ? 'dateLabel' : 'official.dateLabel'))}:</b> ${esc(dateText(false))}</p>
            <p><b>📍 ${esc(t('official.venueLabel'))}:</b> ${esc(W.venue.address)}</p>
            <p class="pdf-fun-footer__links">${link(W.venue.mapUrl, 'pdf-link', esc(t('pdf.tapMap')))} ${link(W.venue.directionsUrl, 'pdf-link', esc(t('pdf.tapDirections')))}</p>
            <p><b>📞 ${esc(t('pdf.contactLabel'))}:</b> ${link(tel(W.groom.phone), 'pdf-link', esc(W.groom.phone))} (${esc(W.groom.short)})</p>
          </div>
          ${link(W.venue.mapUrl, 'pdf-qr pdf-qr--small', `<img src="${a.qrVenue}" alt=""><span>${esc(t('pdf.scan'))}</span>`)}
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ FRIENDS · page 2: barati guide */
  function friendsGuide(t, a, dateText, includeSpecial) {
    const cards = t('daru.cards');
    const signs = t('daru.signs');
    // Index 0 = "Daru Department" / "Fuel Station": only when the guest opts in.
    const deptCards = includeSpecial ? cards : cards.slice(1);
    const deptSigns = includeSpecial ? signs : signs.slice(1);
    return `
    <section class="pdf-page pdf-page--fun pdf-page--guide">
      <div class="pdf-frame pdf-frame--fun"></div>
      ${corners(a.pink)}
      <div class="pdf-content pdf-content--guide">
        <div class="pdf-group">
          <p class="pdf-kicker pdf-kicker--fun">🎺 ${esc(t('pdf.friendsGuide'))}</p>
          <h2 class="pdf-h2 pdf-h2--fun">${esc(t('map.title'))}</h2>
          ${route(t, a)}
          ${venueBox(t, a)}
        </div>
        <div class="pdf-group">
          <h3 class="pdf-h3 pdf-h3--fun">${esc(t('pdf.deptTitle'))}</h3>
          <div class="pdf-depts">
            ${deptCards.map((c) => `
              <div class="pdf-dept">
                <div class="pdf-dept__icon">${c.icon}</div>
                <p class="pdf-dept__title">${esc(c.title)}</p>
                <p class="pdf-dept__text">${esc(c.text)}</p>
                ${c.tag ? `<span class="pdf-dept__tag">${esc(c.tag)}</span>` : ''}
              </div>`).join('')}
          </div>
          <div class="pdf-signs">${deptSigns.map((s) => `<span>${esc(s)}</span>`).join('')}</div>
        </div>
        <div class="pdf-group">
          <h3 class="pdf-h3 pdf-h3--fun">${esc(t('pdf.rulesTitle'))}</h3>
          <div class="pdf-rules">${t('pdf.rules').map((r, i) => `<p><b>${i + 1}.</b><span>${esc(r)}</span></p>`).join('')}</div>
          ${includeSpecial ? `<p class="pdf-disclaimer">😄 ${esc(t('daru.badge'))} — ${esc(t('daru.disclaimer'))}</p>` : ''}
        </div>
        <div class="pdf-fun-footer pdf-fun-footer--end">
          <p class="pdf-fun-names pdf-fun-names--small">${esc(W.groom.short)} <span>&amp;</span> ${esc(W.bride.short)}</p>
          <div class="pdf-fun-footer__text">
            <p class="pdf-fun-see">${esc(t('pdf.funFooter'))}</p>
            <p>📅 ${esc(dateText(true))}</p>
            <p>📞 ${link(tel(W.groom.phone), 'pdf-link', esc(W.groom.phone))} (${esc(W.groom.short)}) · ${link(tel(W.father.phone), 'pdf-link', esc(W.father.phone))} (${esc(W.father.short)})</p>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ stage */
  function buildStage(type, lang, includeSpecial, assets) {
    const t = (k) => window.App.t(k, lang);
    const dateText = (full) => window.App.dateText(full, lang);
    const pages = type === 'family'
      ? [formalCard(t, assets, dateText, lang), familyVenuePage(t, assets)]
      : [friendsCard(t, assets, dateText), friendsGuide(t, assets, dateText, includeSpecial)];
    const stage = document.createElement('div');
    stage.className = 'pdf-stage' + (lang === 'en' ? '' : ' pdf-dev');
    stage.setAttribute('lang', window.I18N[lang].htmlLang);
    stage.setAttribute('aria-hidden', 'true');
    // Small credit line at the bottom edge of every page
    const credit = W.createdBy ? `<p class="pdf-credit">${esc(t('footer.credit'))} ${esc(W.createdBy)}</p>` : '';
    stage.innerHTML = pages.map((pg) => pg.replace(/<\/section>\s*$/, credit + '</section>')).join('');
    document.body.appendChild(stage);
    return stage;
  }

  function waitImages(root) {
    return Promise.all([...root.querySelectorAll('img')].map((img) =>
      img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = r; })));
  }

  /** Detects content that would be cut off, and text lines that collide with each other. */
  function layoutReport(stage) {
    return [...stage.querySelectorAll('.pdf-page')].map((page, i) => {
      const pb = page.getBoundingClientRect();
      const content = page.querySelector('.pdf-content');
      let bottom = pb.top;
      content.querySelectorAll('*').forEach((el) => { bottom = Math.max(bottom, el.getBoundingClientRect().bottom); });

      // Collect every rendered line box of text (Range rects), then look for any two that intersect.
      const lines = [];
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        [...range.getClientRects()].forEach((r) => { if (r.width > 1 && r.height > 1) lines.push({ r, text: node.textContent.trim().slice(0, 24) }); });
      }
      const overlaps = [];
      for (let x = 0; x < lines.length; x++) {
        for (let y = x + 1; y < lines.length; y++) {
          const A = lines[x].r, B = lines[y].r;
          const ov = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
          const oh = Math.min(A.right, B.right) - Math.max(A.left, B.left);
          // Line boxes include the font's ascent/descent padding, so neighbours may graze each other;
          // a real collision overlaps by more than a quarter of the smaller line's height.
          if (oh > 3 && Math.abs(A.top - B.top) > 2 && ov > 0.25 * Math.min(A.height, B.height)) overlaps.push(`"${lines[x].text}" × "${lines[y].text}"`);
        }
      }
      const limit = Math.round(pb.height - 36);
      const contentBottom = Math.round(bottom - pb.top);
      return { page: i + 1, contentBottom, limit, overflow: contentBottom > limit, overlaps };
    });
  }

  /* ------------------------------------------------------------ print mode (used by tools/build-pdfs.mjs) */
  const PRINT_CSS = `
    @page { size: 210mm 297mm; margin: 0; }
    html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; overflow: visible !important; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pdf-stage.is-print { position: static; left: auto; width: 210mm; }
    .pdf-stage.is-print .pdf-page { width: 210mm; height: 297mm; break-after: page; }
    .pdf-stage.is-print .pdf-page:last-child { break-after: auto; }`;

  async function renderForPrint(type, { lang = 'en', includeSpecial = false } = {}) {
    if (type === 'family') includeSpecial = false;
    await loadScript('vendor/qrcode.js');
    await ensureFonts();
    const assets = await buildAssets('print');
    const stage = buildStage(type, lang, includeSpecial, assets);
    stage.classList.add('is-print');
    stage.removeAttribute('aria-hidden');
    document.body.className = '';
    document.body.replaceChildren(stage);
    const st = document.createElement('style');
    st.textContent = PRINT_CSS;
    document.head.appendChild(st);
    document.documentElement.lang = window.I18N[lang].htmlLang;
    document.title = pdfTitle(type);
    await waitImages(stage);
    await ensureFonts();
    return { file: staticKey(type, lang, includeSpecial) + '.pdf', downloadName: fileName(type, lang), report: layoutReport(stage), signature: signature() };
  }

  /* ------------------------------------------------------------ download */
  function triggerDownload(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function prebuiltUrl(type, lang, includeSpecial) {
    const M = window.PDF_MANIFEST;
    if (!M || !/^https?:$/.test(location.protocol) || M.signature !== signature()) return null;
    const file = M.files && M.files[staticKey(type, lang, includeSpecial)];
    if (!file) return null;
    try {
      const res = await fetch(file, { method: 'HEAD', cache: 'no-cache' });
      return res.ok ? file : null;
    } catch (e) { return null; }
  }

  async function generate(type, { lang = 'en', includeSpecial = false, save = true, forceLive = false } = {}) {
    if (!['family', 'friends'].includes(type)) throw new Error('Unknown PDF type: ' + type);
    if (type === 'family') includeSpecial = false; // formal card never contains jokes or alcohol references
    const name = fileName(type, lang);

    if (save && !forceLive) {
      const url = await prebuiltUrl(type, lang, includeSpecial);
      if (url) { triggerDownload(url, name); return { filename: name, source: 'prebuilt', url }; }
    }

    // Live fallback: html2canvas + jsPDF
    await ensureLibs();
    await ensureFonts();
    const assets = await buildAssets('canvas');
    const stage = buildStage(type, lang, includeSpecial, assets);
    try {
      await waitImages(stage);
      const report = layoutReport(stage);
      if (report.some((r) => r.overflow || r.overlaps.length)) console.warn('PDF layout issue ' + JSON.stringify(report));

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      const pageEls = [...stage.querySelectorAll('.pdf-page')];
      for (let i = 0; i < pageEls.length; i++) {
        const el = pageEls[i];
        const canvas = await window.html2canvas(el, {
          scale: SCALE, useCORS: true, backgroundColor: null, logging: false,
          width: A4.w, height: A4.h,
          windowWidth: Math.max(document.documentElement.clientWidth, A4.w + 40),
          // Only clone the PDF stage — skips the website, iframes and the effects canvas.
          ignoreElements: (node) =>
            node !== stage && !stage.contains(node) && !node.contains(stage) &&
            document.body.contains(node) && node.tagName !== 'STYLE' && node.tagName !== 'LINK',
        });
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, A4.mmW, A4.mmH, undefined, 'FAST');
        const p = el.getBoundingClientRect();
        const kx = A4.mmW / p.width, ky = A4.mmH / p.height;
        el.querySelectorAll('[data-link]').forEach((ln) => {
          const r = ln.getBoundingClientRect();
          if (r.width && r.height) pdf.link((r.left - p.left) * kx, (r.top - p.top) * ky, r.width * kx, r.height * ky, { url: ln.dataset.link });
        });
        canvas.width = canvas.height = 0; // free memory on phones
      }
      pdf.setProperties({ title: pdfTitle(type), subject: 'Wedding Invitation', author: `The ${W.familyName} Family`, creator: 'Sonu & Kajal Wedding Invitation' });
      if (save) pdf.save(name);
      return { filename: name, source: 'live', pages: pageEls.length, report, pdf };
    } finally {
      stage.remove();
    }
  }

  window.WeddingPDF = { generate, renderForPrint, signature, _buildStage: buildStage, _buildAssets: buildAssets, _ensureLibs: ensureLibs, _ensureFonts: ensureFonts, _layoutReport: layoutReport };
})();
