/* ==========================================================================
   ORNAMENTS — self-contained SVG strings shared by the website and the PDF.
   (Self-contained SVGs render reliably in html2canvas, unlike <use> refs.)
   ========================================================================== */
(function () {
  const GOLD = '#d4af37';
  const rotRing = (n, d, attrs = '', offset = 0) => {
    let s = '';
    for (let i = 0; i < n; i++) s += `<path d="${d}" transform="rotate(${offset + (i * 360) / n})" ${attrs}/>`;
    return s;
  };
  const wrap = (vb, body, extra = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" ${extra}>${body}</svg>`;

  /** Traditional layered mandala, centred at 0,0. */
  function mandala(color = GOLD, sw = 1) {
    let dots = '';
    for (let i = 0; i < 32; i++) dots += `<circle cx="0" cy="-88" r="1.6" transform="rotate(${i * 11.25})"/>`;
    let inner = '';
    for (let i = 0; i < 24; i++) inner += `<circle cx="0" cy="-41" r="1.1" transform="rotate(${i * 15})"/>`;
    const body = `
      <g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="round">
        <circle r="98"/><circle r="94" stroke-width="${sw * 0.6}"/>
        ${rotRing(16, 'M0,-93 C11,-84 12,-76 0,-70 C-12,-76 -11,-84 0,-93Z')}
        ${rotRing(16, 'M0,-84 C6,-78 6,-74 0,-70 C-6,-74 -6,-78 0,-84Z', '', 11.25)}
        <circle r="70"/><circle r="66" stroke-width="${sw * 0.6}"/>
        ${rotRing(12, 'M0,-66 C15,-58 16,-50 0,-44 C-16,-50 -15,-58 0,-66Z')}
        ${rotRing(12, 'M0,-60 C5,-55 5,-50 0,-47 C-5,-50 -5,-55 0,-60Z')}
        ${rotRing(12, 'M0,-64 L3,-56 L0,-50 L-3,-56Z', '', 15)}
        <circle r="44"/><circle r="37" stroke-width="${sw * 0.6}"/>
        ${rotRing(8, 'M0,-37 C10,-30 10,-23 0,-17 C-10,-23 -10,-30 0,-37Z')}
        ${rotRing(8, 'M0,-33 L4,-26 L0,-21 L-4,-26Z', '', 22.5)}
        <circle r="14"/><circle r="9" stroke-width="${sw * 0.6}"/>
      </g>
      <g fill="${color}">${dots}${inner}<circle r="4"/></g>`;
    return wrap('-100 -100 200 200', body);
  }

  /** Floral corner ornament. rot: 0 = top-left, 90 = top-right, 180 = bottom-right, 270 = bottom-left. */
  function corner(color = GOLD, rot = 0) {
    let petals = '';
    for (let i = 0; i < 8; i++)
      petals += `<ellipse cx="34" cy="24" rx="3.6" ry="9" transform="rotate(${i * 45} 34 34)"/>`;
    const leaf = (x, y, a) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="8" transform="rotate(${a} ${x} ${y})"/>`;
    const body = `
      <g transform="rotate(${rot} 80 80)">
        <g fill="none" stroke="${color}" stroke-linecap="round">
          <path d="M6 154 V44 Q6 6 44 6 H154" stroke-width="2"/>
          <path d="M15 154 V50 Q15 15 50 15 H154" stroke-width="0.9"/>
          <path d="M34 48 C40 74 22 92 32 124" stroke-width="1.4"/>
          <path d="M48 34 C74 40 92 22 124 32" stroke-width="1.4"/>
          <path d="M54 76 C38 70 40 48 58 46 C74 44 78 62 66 68 C60 58 52 60 56 66" stroke-width="1.3"/>
          <path d="M76 54 C70 38 48 40 46 58" stroke-width="1"/>
        </g>
        <g fill="${color}">
          ${petals}
          <circle cx="34" cy="34" r="4.5" fill="#fff6d8" stroke="${color}"/>
          ${leaf(36, 66, 30)}${leaf(26, 88, -35)}${leaf(29, 108, 25)}
          ${leaf(66, 36, 60)}${leaf(88, 26, 125)}${leaf(108, 29, 65)}
          <circle cx="32" cy="128" r="3"/><circle cx="128" cy="32" r="3"/>
          <circle cx="78" cy="78" r="2.4"/><circle cx="88" cy="88" r="1.6"/><circle cx="96" cy="96" r="1.1"/>
          <circle cx="6" cy="154" r="2"/><circle cx="154" cy="6" r="2"/>
        </g>
      </g>`;
    return wrap('0 0 160 160', body);
  }

  /** Lotus divider line. */
  function divider(color = GOLD) {
    const body = `
      <g fill="none" stroke="${color}" stroke-linecap="round">
        <path d="M8 18 H122" stroke-width="1.2"/><path d="M198 18 H312" stroke-width="1.2"/>
        <path d="M30 22 H112" stroke-width="0.6"/><path d="M208 22 H290" stroke-width="0.6"/>
        <path d="M146 29 H174" stroke-width="1.2"/>
      </g>
      <g fill="${color}">
        <path d="M160 3 C167 10 167 19 160 27 C153 19 153 10 160 3Z"/>
        <path d="M159 27 C149 25 141 18 138 9 C148 11 155 18 159 27Z" opacity=".85"/>
        <path d="M161 27 C171 25 179 18 182 9 C172 11 165 18 161 27Z" opacity=".85"/>
        <path d="M126 18 l4 -4 l4 4 l-4 4z"/><path d="M186 18 l4 -4 l4 4 l-4 4z"/>
        <circle cx="140" cy="20" r="1.8"/><circle cx="180" cy="20" r="1.8"/>
        <circle cx="8" cy="18" r="2"/><circle cx="312" cy="18" r="2"/>
      </g>`;
    return wrap('0 0 320 32', body);
  }

  /** Marigold toran (garland) with mango leaves and bells. */
  function toran(width = 800, swags = 6) {
    const h = 96;
    const seg = width / swags;
    let flowers = '';
    let hangs = '';
    const marigold = (x, y, r, i) => {
      const c = i % 3 === 0 ? '#ff8a00' : i % 3 === 1 ? '#ffb300' : '#f57c00';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}"/>` +
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.45).toFixed(1)}" fill="#e65100" opacity=".55"/>`;
    };
    for (let s = 0; s < swags; s++) {
      const x0 = s * seg, x1 = x0 + seg, cx = (x0 + x1) / 2;
      for (let k = 0; k <= 14; k++) {
        const t = k / 14;
        const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) * (1 - t) * 8 + 2 * (1 - t) * t * 62 + t * t * 8;
        flowers += marigold(x, y, 6.2, k + s);
      }
    }
    for (let s = 0; s <= swags; s++) {
      const x = s * seg;
      hangs += `<path d="M${x} 8 V58" stroke="#d4af37" stroke-width="1.4"/>`;
      for (let k = 0; k < 4; k++) hangs += marigold(x, 18 + k * 11, 5, k + s);
      hangs += `<ellipse cx="${x - 5}" cy="68" rx="4" ry="11" fill="#2e7d32" transform="rotate(20 ${x - 5} 68)"/>`;
      hangs += `<ellipse cx="${x + 5}" cy="68" rx="4" ry="11" fill="#388e3c" transform="rotate(-20 ${x + 5} 68)"/>`;
      hangs += `<path d="M${x - 6} 84 Q${x} 70 ${x + 6} 84 Z" fill="#d4af37"/><circle cx="${x}" cy="86" r="2" fill="#a8801f"/>`;
    }
    const body = `<path d="M0 6 H${width}" stroke="#d4af37" stroke-width="3"/>${flowers}${hangs}`;
    return wrap(`0 0 ${width} ${h}`, body, 'preserveAspectRatio="xMidYMin slice"');
  }

  /** Mangal kalash with mango leaves and coconut. */
  function kalash(color = GOLD) {
    const body = `
      <g>
        <ellipse cx="30" cy="30" rx="6" ry="14" fill="#2e7d32" transform="rotate(-50 30 30)"/>
        <ellipse cx="50" cy="30" rx="6" ry="14" fill="#2e7d32" transform="rotate(50 50 30)"/>
        <ellipse cx="34" cy="26" rx="5" ry="13" fill="#43a047" transform="rotate(-22 34 26)"/>
        <ellipse cx="46" cy="26" rx="5" ry="13" fill="#43a047" transform="rotate(22 46 26)"/>
        <circle cx="40" cy="22" r="11" fill="#8d5524"/>
        <path d="M34 15 Q40 11 46 15" stroke="#5d3a1a" stroke-width="1.4" fill="none"/>
        <ellipse cx="40" cy="38" rx="15" ry="4" fill="${color}"/>
        <path d="M28 38 H52 V46 H28Z" fill="${color}"/>
        <path d="M27 46 C10 54 10 82 40 86 C70 82 70 54 53 46 Z" fill="${color}"/>
        <path d="M18 60 H62" stroke="#a8801f" stroke-width="2"/>
        <path d="M17 68 H63" stroke="#c62828" stroke-width="2.5"/>
        <path d="M40 52 l3 6 l-3 6 l-3 -6z" fill="#c62828"/>
        <circle cx="30" cy="76" r="1.8" fill="#a8801f"/><circle cx="40" cy="78" r="1.8" fill="#a8801f"/><circle cx="50" cy="76" r="1.8" fill="#a8801f"/>
      </g>`;
    return wrap('0 0 80 90', body);
  }

  /** Top-down view of the "Barati Express" car (front faces down). */
  function car() {
    const body = `
      <rect x="5" y="6" width="34" height="64" rx="11" fill="#b71c1c" stroke="#f3d98b" stroke-width="1.5"/>
      <rect x="2" y="16" width="5" height="10" rx="2" fill="#222"/><rect x="37" y="16" width="5" height="10" rx="2" fill="#222"/>
      <rect x="2" y="50" width="5" height="10" rx="2" fill="#222"/><rect x="37" y="50" width="5" height="10" rx="2" fill="#222"/>
      <path d="M11 16 H33 L30 24 H14Z" fill="#3e2723" opacity=".85"/>
      <path d="M13 50 H31 L34 58 H10Z" fill="#3e2723" opacity=".85"/>
      <path d="M22 30 C19 26 14 28 15 32 C16 36 22 40 22 40 C22 40 28 36 29 32 C30 28 25 26 22 30Z" fill="#ffd54f"/>
      <rect x="20.5" y="6" width="3" height="64" fill="#f3d98b" opacity=".55"/>
      <circle cx="11" cy="67" r="2.6" fill="#fff59d"/><circle cx="33" cy="67" r="2.6" fill="#fff59d"/>
      <circle cx="11" cy="9" r="2" fill="#ff5252"/><circle cx="33" cy="9" r="2" fill="#ff5252"/>`;
    return wrap('0 0 44 76', body);
  }

  /** Location pin. */
  function pin(color = '#c62828', inner = '#fff') {
    const body = `<path d="M15 1 C7 1 1 7 1 15 C1 26 15 39 15 39 C15 39 29 26 29 15 C29 7 23 1 15 1Z" fill="${color}" stroke="#f3d98b" stroke-width="1.2"/><circle cx="15" cy="15" r="5.5" fill="${inner}"/>`;
    return wrap('0 0 30 40', body);
  }

  const uri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  window.Ornaments = { mandala, corner, divider, toran, kalash, car, pin, uri, GOLD };
})();
