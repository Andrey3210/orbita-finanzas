import { accounts, categories, expenses, months, latest, previous, movements, money, signed, sum, monthMovements, byDay, totals, balances, portfolio, daily, groups, compareDay, routes, forecastStart, events, defaultDates, project } from './model.js';
import { icon } from './icons.js';

const sections = [
  ['inicio', 'Inicio', 'home'], ['cuentas', 'Cuentas', 'wallet'], ['explorar', 'Explorar', 'compass'],
  ['simular', 'Simular', 'flask'], ['actividad', 'Actividad', 'pulse'],
];
const getSection = () => sections.some(s => '#' + s[0] === location.hash) ? location.hash.slice(1) : 'inicio';
const state = {
  section: getSection(), month: latest, day: 15, kind: 'expense', opened: false, category: null,
  tab: 'days', compare: previous, selectedRoute: null, dates: defaultDates(), event: 'cobro',
  filter: { account: '', kind: '', search: '' }, steps: new Set(),
};
let lastCompareKey = '';
const main = document.querySelector('#content');
const nav = document.querySelector('#nav');
const dialog = document.querySelector('#movement-dialog');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const monthName = m => months[m].label;
const kindName = { expense: 'Gastos', income: 'Ingresos', transfer: 'Transferencias' };
const account = id => accounts.find(a => a.id === id);
const dateText = (m, day) => `${day} de ${monthName(m).toLowerCase()}`;
const amount = m => (m.kind === 'expense' ? '−' : m.kind === 'income' ? '+' : '') + money(m.cents);
const negative = cents => cents < 0 ? 'negative' : 'positive';
const num = (n, places = 0) => new Intl.NumberFormat('en-PE', { minimumFractionDigits: places, maximumFractionDigits: places }).format(n);
const option = (value, label, selected) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`;
const action = (id, value = '') => `data-action="${id}" data-value="${value}"`;
const select = (label, id, items, selected, extra = '') => `<label class="select-wrap ${extra}"><span class="sr-only">${label}</span>${icon(id.includes('month') ? 'calendar' : 'layers', 15)}<select data-change="${id}">${items.map(([v, l]) => option(v, l, selected)).join('')}</select>${icon('chevronDown', 13)}</label>`;
const monthItems = Object.keys(months).reverse().map(m => [m, monthName(m) + ' 2026']);
const heading = (label, title, desc, extra = '') => `<div class="section-heading"><div><p class="eyebrow">${label}</p><h1>${title}</h1><p>${desc}</p></div>${extra}</div>`;
const badgeIcon = (glyph, color = 'violet') => `<span class="badge-icon ${color}">${icon(glyph, 19)}</span>`;
const metricIcon = (glyph, color) => `<span class="metric-icon ${color}">${icon(glyph, 17)}</span>`;
const prefix = (n, t = 0) => n < t ? '−' : '+';
const change = (a, b) => b ? (a - b) / b * 100 : null;
const pct = n => n === null ? '—' : prefix(n) + num(Math.abs(n), 1) + '%';
const plotScale = kind => {
  const max = Math.max(...Object.keys(months).flatMap(m => daily(m, kind))) / 100;
  const step = max > 2000 ? 1500 : max > 800 ? 400 : 200;
  return Math.ceil(max / (step * 4)) * step * 4 * 100;
};

nav.insertAdjacentHTML('beforeend', sections.map(([id, label, glyph]) => `<a class="nav-link" href="#${id}" data-nav="${id}"><span class="nav-glyph">${icon(glyph, 21)}</span><span>${label}</span></a>`).join(''));
document.querySelector('#demo-icon').innerHTML = icon('flask', 16);

function navPosition() {
  const links = [...nav.querySelectorAll('[data-nav]')];
  const selected = links.find(a => a.dataset.nav === state.section);
  for (const a of links) a === selected ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  const indicator = document.querySelector('#nav-indicator');
  const target = matchMedia('(max-width: 760px)').matches ? selected.querySelector('.nav-glyph') : selected;
  const a = target.getBoundingClientRect(), b = nav.getBoundingClientRect();
  indicator.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
  indicator.style.width = a.width + 'px';
  indicator.style.height = a.height + 'px';
  document.querySelector('#crumb-label').textContent = selected.textContent.trim().toUpperCase();
  document.querySelector('#period-label').innerHTML = icon('calendar', 15) + '<span>' + (state.section === 'simular' ? 'Noviembre' : monthName(state.month)) + ' 2026</span>';
}
window.addEventListener('resize', () => {
  navPosition();
  if (state.section === 'simular') updateSim();
});

const metric = (title, value, glyph, color, note, tone = '') => `<article class="metric">
  <div class="metric-top">${metricIcon(glyph, color)}<span>${title}</span></div>
  <strong class="${tone}">${value}</strong><small>${note}</small></article>`;

function home() {
  const t = totals(state.month), old = state.month === latest ? totals(previous) : null;
  const net = t.income - t.expense;
  return `<section class="hero">
    <div class="hero-copy"><p class="eyebrow"><i></i> ESTACIÓN FINANCIERA</p>
      <h1>Hola, explorador<span>.</span></h1><p>Descubre qué mueve tu dinero.</p>
      <div class="hero-balance"><span>SALDO TOTAL</span><div><strong>${money(portfolio(state.month))}</strong><span class="net-pill ${negative(net)}">${icon(net < 0 ? 'trendDown' : 'trend', 14)} ${signed(net)}</span></div></div>
    </div><div class="hero-art-label"><i></i> ÓRBITA 01 <span>·</span> EN LÍNEA</div>
  </section>
  <section class="metrics" aria-label="Resumen del mes">
    ${metric('Ingresos del mes', money(t.income), 'arrowDown', 'teal', old ? `<b class="positive">${pct(change(t.income, old.income))}</b> vs. septiembre` : 'Total del período')}
    ${metric('Gastos del mes', money(t.expense), 'arrowUp', 'rose', old ? `<b class="negative">${pct(change(t.expense, old.expense))}</b> vs. septiembre` : 'Total del período')}
    ${metric('Balance del mes', signed(net), 'pulse', 'violet', 'Ingresos menos gastos', negative(net))}
  </section>
  <div class="home-grid"><div>${dayPanel(true)}</div><div class="home-side">${mission()}${signal()}</div></div>`;
}

function mission() {
  const steps = [
    ['cuentas', 'wallet', 'Revisa tu saldo', 'Ubica tus cuentas.', 'violet'],
    ['explorar', 'bars', 'Descubre qué cambió', 'Investiga un pico del mes.', 'teal'],
    ['simular', 'flask', 'Prueba un escenario', 'Ensaya un cambio de fecha.', 'blue'],
  ];
  return `<section class="panel mission"><p class="eyebrow">${icon('spark', 14)} GUÍA OPCIONAL</p><h2>Ruta de exploración</h2>
    <p>Tres paradas para conocer tu dinero.</p>
    <ol>${steps.map(([id, glyph, label, desc, color]) => `<li><button ${action('step', id)}>${badgeIcon(state.steps.has(id) ? 'check' : glyph, color)}<span><strong>${label}</strong><small>${desc}</small></span>${icon('chevron', 15)}</button></li>`).join('')}</ol>
    <div class="mission-progress"><span>${state.steps.size} de 3 exploradas</span><div aria-hidden="true">${steps.map((_, i) => `<i class="${i < state.steps.size ? 'done' : ''}"></i>`).join('')}</div></div></section>`;
}

function signal() {
  const day = daily(state.month).indexOf(Math.max(...daily(state.month))) + 1;
  return `<section class="panel signal"><div>${badgeIcon('spark', 'teal')}<span class="eyebrow">SEÑAL DETECTADA</span></div><p>El <strong>${dateText(state.month, day)}</strong> registró el mayor gasto del mes.</p><button class="link-button" ${action('signal', day)}>Investigar señal ${icon('arrowRight', 15)}</button></section>`;
}

function dayPanel(isHome = false) {
  const values = daily(state.month, state.kind);
  const scale = plotScale(state.kind);
  const topDay = values.indexOf(Math.max(...values)) + 1;
  const day = Math.min(state.day, values.length);
  const list = byDay(state.month, day, state.kind);
  const breakdown = groups(list);
  const total = sum(list);
  const guides = [1, .75, .5, .25, 0];
  const labelDays = state.month === latest ? [1, 5, 10, 15, 20, 25, 31] : [1, 5, 10, 15, 20, 25, 30];
  return `<section class="panel day-panel" aria-labelledby="day-title">
    <div class="panel-head"><div><p class="eyebrow">${icon('bars', 14)} MAPA DE ACTIVIDAD</p><h2 id="day-title">Paisaje del mes</h2><p>Toca una columna para ver qué hay dentro.</p></div>${select('Mes del gráfico', 'month', monthItems, state.month)}</div>
    <div class="chart-toolbar"><div class="segmented" aria-label="Datos del gráfico">
      ${['expense', 'income', 'transfer'].map(k => `<button ${action('kind', k)} aria-pressed="${state.kind === k}">${kindName[k]}</button>`).join('')}</div><span class="plot-unit">PEN / DÍA</span></div>
    <div class="bar-figure ${state.opened ? 'drilling' : ''}">
      <div class="y-labels" aria-hidden="true">${guides.map(g => `<span>${num(scale * g / 100)}</span>`).join('')}</div>
      <div class="bar-plot" style="--days:${values.length}">
        <div class="grid-lines" aria-hidden="true">${guides.map(() => '<i></i>').join('')}</div>
        ${values.map((cents, i) => {
          const d = i + 1, highlighted = d === (state.opened ? day : topDay);
          const split = state.opened && highlighted && breakdown.length > 0;
          const height = cents / scale * 100;
          return `<div class="bar-cell ${highlighted ? 'highlighted' : ''} ${split ? 'split' : ''}" style="--height:${height}%">
            <button class="bar-hit" ${action('day', d)} aria-label="${dateText(state.month, d)}: ${money(cents)}" aria-pressed="${state.opened && day === d}"><span class="bar-solid ${cents === 0 ? 'zero' : ''}"></span></button>
            ${highlighted && !state.opened && cents > 0 ? `<button class="peak-label" ${action('day', d)} aria-label="Investigar pico del ${dateText(state.month, d)}">${d} ${months[state.month].short.toUpperCase()} <b>${money(cents)}</b></button>` : ''}
            ${split ? `<div class="bar-split">${breakdown.map(g => `<button ${action('category', g.category)} title="${categories[g.category].label} · ${money(g.cents)}" aria-label="${categories[g.category].label}: ${money(g.cents)}" aria-pressed="${g.category === state.category}" style="--share:${g.cents};--tint:${categories[g.category].color}"></button>`).join('')}</div>` : ''}
            ${labelDays.includes(d) ? `<span class="x-tick">${String(d).padStart(2, '0')}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
    ${state.opened ? `<div class="day-detail" id="day-detail">
      <div class="detail-head"><div><p class="eyebrow">DÍA ${String(day).padStart(2, '0')} / ${monthName(state.month).toUpperCase()}</p><h3>${money(total)}</h3></div><button class="subtle-button" ${action('compare-day') }>${icon('layers', 15)} Comparar este día</button></div>
      ${breakdown.length ? `<div class="category-grid">${breakdown.map(g => `<button class="category-tile" style="--tint:${categories[g.category].color}" ${action('category', g.category)} aria-pressed="${state.category === g.category}"><i></i><span>${categories[g.category].label}</span><strong>${money(g.cents)}</strong>${icon('chevron', 14)}</button>`).join('')}</div>` : '<p class="empty">No hay movimientos de este tipo en este día.</p>'}
      ${state.category && breakdown.some(g => g.category === state.category) ? `<div class="unfold" id="segment-detail"><p class="eyebrow">${categories[state.category].label} / MOVIMIENTOS</p>${movementList(breakdown.find(g => g.category === state.category).items)}</div>` : ''}
    </div>` : `<div class="chart-foot"><span><i></i> ${kindName[state.kind]} diarios</span><button class="link-button" ${action(isHome ? 'explore' : 'compare-day') }>${isHome ? 'Ir a Explorar' : 'Comparar meses'} ${icon('arrowRight', 15)}</button></div>`}
  </section>`;
}

function movementList(items) {
  return items.length ? `<div class="movement-list">${items.map(m => `<button class="movement" ${action('movement', m.id)}><span class="movement-icon" style="--tint:${categories[m.category].color}">${icon(categories[m.category].icon, 17)}</span><span class="movement-copy"><strong>${m.label}</strong><small>${dateText(m.month, m.day)} · ${account(m.account).short}${m.to ? ' → ' + account(m.to).short : ''}</small></span><strong class="movement-amount ${m.kind === 'income' ? 'positive' : ''}">${amount(m)}</strong>${icon('chevron', 14)}</button>`).join('')}</div>` : '<p class="empty">No encontramos movimientos para estos filtros.</p>';
}

function accountsView() {
  const b = balances(state.month);
  return heading('01 / CARTERA', 'Tus cuentas', 'El dinero cambia de órbita cuando lo mueves entre tus cuentas.', select('Mes de las cuentas', 'month', monthItems, state.month))
    + `<div class="wallet-total panel"><div>${badgeIcon('wallet')}<p class="eyebrow">SALDO CONSOLIDADO</p><h2>${money(portfolio(state.month))}</h2></div><span>Al cierre de ${monthName(state.month).toLowerCase()} · PEN</span></div>
    <div class="account-grid">${accounts.map(a => `<article class="panel account-card" style="--tint:${a.color}">
      <span class="movement-icon">${icon(a.icon, 21)}</span><p class="eyebrow">•••• ${a.suffix}</p><h2>${a.label}</h2><strong>${signed(b[a.id]).replace(/^\+/, '')}</strong>
      <button class="link-button" ${action('account', a.id)}>Ver movimientos ${icon('arrowRight', 15)}</button></article>`).join('')}</div>
    <section class="panel block"><div class="panel-head"><div><p class="eyebrow">${icon('transfer', 14)} ÓRBITAS INTERNAS</p><h2>Entre tus cuentas</h2><p>Estas transferencias cambian el saldo de cada cuenta. Tus ingresos y gastos siguen iguales.</p></div></div>${movementList(monthMovements(state.month).filter(m => m.kind === 'transfer'))}</section>`;
}

function explore() {
  return heading('02 / EXPLORACIÓN', 'Explorar', 'Acércate a un día, superpón dos meses o sigue el recorrido de tu dinero.')
    + `<div class="view-tabs" aria-label="Vistas de exploración">${[['days', 'bars', 'Por día'], ['compare', 'layers', 'Comparar meses'], ['flow', 'flow', 'Flujo de dinero']].map(([id, glyph, label]) => `<button ${action('tab', id)} aria-pressed="${state.tab === id}">${icon(glyph, 17)} ${label}</button>`).join('')}</div>`
    + (state.tab === 'days' ? dayPanel() : state.tab === 'compare' ? comparePanel() : flowPanel());
}

const pathOf = points => points.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' ');
const stepPath = points => points.map(([x, y], i) => i ? `H${x.toFixed(2)}V${y.toFixed(2)}` : `M${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
function comparePanel() {
  const a = daily(state.month, state.kind), b = daily(state.compare, state.kind);
  const scale = plotScale(state.kind), d = state.day, diff = compareDay(state.month, state.compare, d, state.kind);
  const x = i => i * 600 / 30, y = n => 176 - n * 166 / scale;
  const points = values => values.map((v, i) => [x(i), y(v)]);
  const lineA = points(a), lineB = points(b);
  const n = Math.min(a.length, b.length);
  const area = pathOf([...lineA.slice(0, n), ...lineB.slice(0, n).reverse()]) + 'Z';
  // Per interval, the two strokes may cross. Clip the shared area to two masks so each sign stays legible.
  const above = line => pathOf([...line, [line.at(-1)[0], 0], [0, 0]]) + 'Z';
  const below = line => pathOf([...line, [line.at(-1)[0], 180], [0, 180]]) + 'Z';
  const daySelector = select('Día para comparar', 'compare-day-select', Array.from({ length: 31 }, (_, i) => [String(i + 1), 'Día ' + (i + 1)]), String(d));
  const choices = monthItems;
  const key = [state.month, state.compare, state.kind].join('/');
  const reveal = lastCompareKey !== key;
  lastCompareKey = key;
  return `<section class="panel block compare-panel">
    <div class="panel-head"><div><p class="eyebrow">${icon('layers', 14)} SUPERPOSICIÓN</p><h2>Dos meses, una escala</h2><p>Arrastra un mes sobre el otro o elige ambos con los controles.</p></div>${select('Tipo de movimiento', 'compare-kind', Object.entries(kindName), state.kind)}</div>
    <div class="compare-controls">
      ${[['base-month', state.month, 'Mes base'], ['other-month', state.compare, 'Mes de referencia']].map(([id, m, label], i) => `<div class="compare-control ${i ? 'ref' : 'base'}" data-month-target><span class="drag-chip" title="Arrastrar ${monthName(m)}" data-month-drag="${i}" aria-hidden="true">⋮⋮</span>${select(label, id, choices, m)}</div>`).join('')}
      <button class="subtle-button swap" ${action('swap')} aria-label="Intercambiar meses">${icon('transfer', 16)} <span>Intercambiar</span></button>
    </div>
    <div class="compare-key"><span><i></i>${monthName(state.month)}</span><span class="reference"><i></i>${monthName(state.compare)}</span><span class="plot-unit">PEN / DÍA</span></div>
    <div class="line-figure"><div class="y-labels" aria-hidden="true">${[1,.75,.5,.25,0].map(t => `<span>${num(scale * t / 100)}</span>`).join('')}</div>
      <div class="line-plot">
      <svg viewBox="-3 0 606 180" preserveAspectRatio="none" role="img" aria-label="Curvas de ${kindName[state.kind].toLowerCase()} por día en la misma escala">
        <defs><clipPath id="above-a"><path d="${above(lineA)}"/></clipPath><clipPath id="below-a"><path d="${below(lineA)}"/></clipPath></defs>
        ${[10,51.5,93,134.5,176].map(n => `<path class="svg-grid" d="M0 ${n}H600"/>`).join('')}
        <g class="${reveal ? 'compare-fill' : ''}"><path d="${area}" clip-path="url(#below-a)" fill="#41e6ce" opacity=".23"/><path d="${area}" clip-path="url(#above-a)" fill="#a78bfa" opacity=".27"/></g>
        <path d="${pathOf(lineB)}" class="reference-line"/><path d="${pathOf(lineA)}" class="current-line"/>
        <path d="M${x(d - 1)} 7V177" class="guide-line"/>
        ${[[a, '#41e6ce'], [b, '#b7a1fc']].map(([values, color]) => values[d - 1] === undefined ? '' : `<circle cx="${x(d - 1)}" cy="${y(values[d - 1])}" r="3.5" fill="${color}" stroke="#0b1020"/>`).join('')}
      </svg>
      <div class="compare-hits" aria-hidden="true">${Array.from({ length: 31 }, (_, i) => `<button tabindex="-1" ${action('pick-compare', i + 1)} title="Día ${i + 1}"></button>`).join('')}</div>
      <div class="line-days" aria-hidden="true">${[1,5,10,15,20,25,31].map(n => `<span style="left:${(n - 1) / 30 * 100}%">${String(n).padStart(2, '0')}</span>`).join('')}</div>
      </div></div>
    <div class="compare-detail"><div class="detail-head"><div><p class="eyebrow">DIFERENCIA / DÍA ${d}</p><h3>${diff ? signed(diff.delta) : 'Sin día equivalente'}</h3></div>${daySelector}</div>
    ${diff ? `<p>${monthName(state.month)}: <strong>${money(diff.left)}</strong> · ${monthName(state.compare)}: <strong>${money(diff.right)}</strong></p>
    ${diff.diffs.length ? `<div class="category-grid">${diff.diffs.map(({ category, delta }) => `<div class="category-tile" style="--tint:${categories[category].color}"><i></i><span>${categories[category].label}</span><strong>${signed(delta)}</strong></div>`).join('')}</div>` : '<p class="empty">Las categorías no registran diferencias ese día.</p>'}` : '<p>Uno de los meses no tiene día 31. El gráfico muestra los datos disponibles.</p>'}
    </div>
  </section>`;
}

function flowPanel() {
  const all = routes(state.month);
  const sources = accounts.filter(a => all.some(r => r.account === a.id));
  const sinks = expenses.filter(c => all.some(r => r.category === c));
  const active = all.find(r => r.id === state.selectedRoute);
  const grand = sum(all);
  const measure = cents => 3 + cents / grand * 73;
  const distribute = (items, id, key) => {
    const subset = all.filter(r => r[key] === id);
    let cursor = items.length === 1 ? 136 : 34 + items.indexOf(id) * 204 / (items.length - 1);
    cursor -= subset.reduce((n, r) => n + measure(r.cents), 0) / 2;
    return Object.fromEntries(subset.map(r => {
      const w = measure(r.cents), center = cursor + w / 2;
      cursor += w;
      return [r.id, center];
    }));
  };
  return `<section class="panel block flow-panel"><div class="panel-head"><div><p class="eyebrow">${icon('flow', 14)} MAPA DE FLUJOS</p><h2>Sigue el dinero</h2><p>El ancho de cada ruta muestra cuánto salió de una cuenta hacia una categoría.</p></div>${select('Mes del flujo', 'month', monthItems, state.month)}</div>
    <div class="flow-captions"><span>CUENTAS DE ORIGEN</span><span>CATEGORÍAS DE DESTINO</span></div>
    <div class="flow-figure">
      <div class="flow-nodes from">${sources.map(a => `<div style="--y:${(sources.length === 1 ? 136 : 34 + sources.indexOf(a) * 204 / (sources.length - 1)) / 272 * 100}%;--tint:${a.color}"><span>${a.short}</span><i></i></div>`).join('')}</div>
      <svg viewBox="0 0 500 272" preserveAspectRatio="none" aria-label="Rutas de gastos de izquierda a derecha">
        ${[100,200,300,400].map(x => `<path class="svg-grid" d="M${x} 0V272"/>`).join('')}
        ${[...all].sort((a, b) => Number(a.id === active?.id) - Number(b.id === active?.id)).map(r => {
          const sy = distribute(sources.map(a => a.id), r.account, 'account')[r.id], ty = distribute(sinks, r.category, 'category')[r.id];
          const d = `M0 ${sy} C180 ${sy},320 ${ty},500 ${ty}`, color = categories[r.category].color;
          const selected = active?.id === r.id;
          return `<g class="flow-route ${active && !selected ? 'dim' : ''} ${selected ? 'lit' : ''}" ${action('route', r.id)}><title>${account(r.account).label} → ${categories[r.category].label}: ${money(r.cents)}</title>
            <path d="${d}" fill="none" stroke="${color}" stroke-width="${measure(r.cents)}"/><path class="flow-hit" d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(12, measure(r.cents))}"/>
            ${reduced.matches ? '' : `<circle r="2.7" fill="#f2f5ff" aria-hidden="true"><animateMotion dur="${2.6 + ty / 165}s" begin="-${sy / 110}s" repeatCount="indefinite" path="${d}"/></circle>`}</g>`;
        }).join('')}
      </svg>
      <div class="flow-nodes to">${sinks.map(c => `<div style="--y:${(34 + sinks.indexOf(c) * 204 / (sinks.length - 1)) / 272 * 100}%;--tint:${categories[c].color}"><i></i><span>${categories[c].label}</span></div>`).join('')}</div>
    </div>
    <div class="flow-controls">${select('Ruta de dinero', 'flow-select', [['', 'Todas las rutas'], ...all.map(r => [r.id, account(r.account).short + ' → ' + categories[r.category].label])], active?.id ?? '')}<span>${all.length} rutas · ${money(grand)} en gastos</span></div>
    ${active ? `<div class="unfold"><div class="detail-head"><div><p class="eyebrow">${account(active.account).label} → ${categories[active.category].label}</p><h3>${money(active.cents)}</h3></div></div>${movementList(active.items)}</div>` : ''}
  </section>`;
}

const simX = day => (day - 1) * 600 / 29;
const simMin = Math.floor((forecastStart + events.filter(e => e.cents < 0).reduce((n, e) => n + e.cents, 0)) / 100000) * 100000;
const simMax = Math.ceil((forecastStart + events.filter(e => e.cents > 0).reduce((n, e) => n + e.cents, 0)) / 100000) * 100000;
const simY = cents => 208 - (cents - simMin) * 196 / (simMax - simMin);
const simLine = series => stepPath(series.map(p => [simX(p.day), simY(p.balance)]));
const original = project();
const shortEvent = e => e.label.split(' · ')[0] + ' de ' + e.label.split(' · ')[1];
function simView() {
  const scale = [simMax, 350000, 175000, 0, simMin];
  return heading('03 / LABORATORIO', 'Simular', 'Cambia la fecha de un cobro o pago y observa el efecto en tu saldo.', `<span class="lab-pill">${icon('flask', 15)} SIMULACIÓN</span>`)
    + `<section class="panel block sim-panel"><div class="panel-head"><div><p class="eyebrow">${icon('pulse', 14)} PROYECCIÓN DE NOVIEMBRE</p><h2>Línea de tiempo</h2><p>Escenario independiente · Saldo inicial de la cuenta de pagos: ${money(forecastStart)}.</p></div><button class="subtle-button" ${action('reset')}>${icon('reset', 15)} Restablecer</button></div>
    <div class="compare-key"><span><i></i>Simulación</span><span class="reference"><i></i>Plan original</span><span class="plot-unit">SALDO / PEN</span></div>
    <div class="line-figure sim-figure"><div class="y-labels" aria-hidden="true">${scale.map(n => `<span style="top:${simY(n) / 220 * 100}%">${n < 0 ? '−' : ''}${num(Math.abs(n) / 100)}</span>`).join('')}</div>
      <div class="line-plot">
        <svg viewBox="-3 0 606 220" preserveAspectRatio="none" role="img" aria-label="Saldo diario proyectado para noviembre">
          ${scale.map(n => `<path d="M0 ${simY(n)}H600" class="${n === 0 ? 'zero-line' : 'svg-grid'}"/>`).join('')}
          <path id="original-line" d="${simLine(original)}" class="reference-line"/><path id="forecast-line" class="current-line"/>
          <path id="shortfall-line" class="shortfall-line"/><circle id="shortfall-point" r="4" fill="#ff7b91"/>
          <path id="event-guide" class="guide-line"/><circle id="event-point" r="3.5" fill="#41e6ce"/>
        </svg>
        <div class="line-days" aria-hidden="true">${[1,5,10,15,20,25,30].map(n => `<span style="left:${(n - 1) / 29 * 100}%">${String(n).padStart(2, '0')}</span>`).join('')}</div>
      </div></div>
    <div class="event-timeline" id="event-timeline" aria-label="Cobros y pagos que puedes mover">
      ${events.map(e => `<button class="event-handle ${e.cents > 0 ? 'credit' : 'debit'}" data-event="${e.id}" title="${shortEvent(e)}" aria-pressed="${state.event === e.id}">${icon(e.cents > 0 ? 'arrowDown' : 'arrowUp', 15)}</button>`).join('')}
    </div>
    <div class="sim-notice" id="sim-notice" role="status" aria-live="polite"></div>
    <div class="sim-controls"><div><p class="eyebrow">MOVER UN MOVIMIENTO</p>${select('Movimiento de la simulación', 'sim-event', events.map(e => [e.id, e.label]), state.event)}</div>
      <div><p class="eyebrow">FECHA EN NOVIEMBRE</p><div class="date-controls"><button class="subtle-button icon-button" ${action('nudge', -1)} aria-label="Adelantar un día">${icon('minus', 17)}</button>
      ${select('Día de noviembre', 'sim-day', Array.from({length: 30}, (_, i) => [String(i + 1), String(i + 1) + ' nov']), String(state.dates[state.event]))}
      <button class="subtle-button icon-button" ${action('nudge', 1)} aria-label="Retrasar un día">${icon('plus', 17)}</button></div></div></div>
    <p class="sim-hint">Arrastra un marcador sobre la línea de tiempo o cambia su día con los controles. Tu historial se mantiene intacto.</p>
    </section>`;
}

function updateSim(announce = true) {
  const series = project(state.dates);
  const first = series.find(p => p.balance < 0);
  const el = id => document.getElementById(id);
  const path = simLine(series);
  el('forecast-line').setAttribute('d', path);
  el('forecast-line').style.d = `path("${path}")`;
  el('original-line').classList.toggle('overlap', events.every(e => state.dates[e.id] === e.day));
  el('shortfall-line').setAttribute('d', first ? `M${simX(first.day)} ${simY(0)}V${simY(first.balance)}` : '');
  const point = el('shortfall-point');
  point.style.display = first ? '' : 'none';
  if (first) {
    point.setAttribute('cx', simX(first.day)); point.setAttribute('cy', simY(first.balance));
  }
  const day = state.dates[state.event], x = simX(day);
  el('event-guide').setAttribute('d', `M${x} 9V210`);
  el('event-point').setAttribute('cx', x);
  el('event-point').setAttribute('cy', simY(series[day - 1].balance));
  const notice = el('sim-notice');
  const msg = first
    ? `${badgeIcon('alert', 'rose')}<div><strong>Primer saldo negativo: ${first.day} de noviembre</strong><span>Faltante: <b>${money(first.balance)}</b></span></div>`
    : `${badgeIcon('check', 'teal')}<div><strong>Sin faltantes en noviembre</strong><span>Saldo proyectado al cierre: <b>${money(series.at(-1).balance)}</b></span></div>`;
  notice.setAttribute('aria-live', announce ? 'polite' : 'off');
  notice.classList.toggle('has-alert', Boolean(first));
  if (notice.innerHTML !== msg) notice.innerHTML = msg;
  main.querySelector('[data-change="sim-event"]').value = state.event;
  main.querySelector('[data-change="sim-day"]').value = String(day);
  main.querySelector('[data-action="nudge"][data-value="-1"]').disabled = day === 1;
  main.querySelector('[data-action="nudge"][data-value="1"]').disabled = day === 30;
  const lanes = [];
  const trackWidth = el('event-timeline').clientWidth;
  const handles = [...main.querySelectorAll('[data-event]')].sort((a, b) => state.dates[a.dataset.event] - state.dates[b.dataset.event]);
  for (const btn of handles) {
    const d = state.dates[btn.dataset.event], e = events.find(e => e.id === btn.dataset.event);
    const x = (d - 1) * trackWidth / 29;
    const free = lanes.findIndex(end => x - end >= 34);
    const depth = free < 0 ? lanes.length : free;
    lanes[depth] = x;
    btn.style.left = (d - 1) / 29 * 100 + '%';
    btn.style.setProperty('--depth', depth);
    btn.setAttribute('aria-pressed', String(state.event === e.id));
    btn.setAttribute('aria-label', `${shortEvent(e)}, ${d} de noviembre, ${money(e.cents)}. Flechas para cambiar de día.`);
  }
  el('event-timeline').style.setProperty('--lanes', lanes.length);
}

function filteredActivity() {
  const q = state.filter.search.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return monthMovements(state.month).filter(m =>
    (!state.filter.account || state.filter.account === m.account || state.filter.account === m.to)
    && (!state.filter.kind || state.filter.kind === m.kind)
    && (!q || `${m.label} ${categories[m.category].label}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q))
  ).reverse();
}
function activityResults() {
  const list = filteredActivity();
  return `<p class="result-count" role="status">${list.length} ${list.length === 1 ? 'movimiento' : 'movimientos'}</p>${movementList(list)}`;
}
function activity() {
  return heading('04 / REGISTRO', 'Actividad', 'Encuentra el movimiento que hizo cambiar tus cifras.', select('Mes de actividad', 'month', monthItems, state.month))
    + `<section class="panel block"><div class="panel-head"><div><p class="eyebrow">${icon('pulse', 14)} REGISTRO DEL MES</p><h2>Movimientos</h2></div></div>
    <div class="filter-row"><label class="search-wrap">${icon('search', 17)}<span class="sr-only">Buscar movimientos</span><input type="search" id="activity-search" placeholder="Buscar un movimiento"></label>
    ${select('Filtrar por cuenta', 'filter-account', [['', 'Todas las cuentas'], ...accounts.map(a => [a.id, a.label])], state.filter.account)}
    ${select('Filtrar por tipo', 'filter-kind', [['', 'Todos los tipos'], ...Object.entries(kindName)], state.filter.kind)}</div>
    <div id="activity-results">${activityResults()}</div></section>`;
}

const views = { inicio: home, cuentas: accountsView, explorar: explore, simular: simView, actividad: activity };
function render({ focus, direction = 0 } = {}) {
  navPosition();
  if (state.section !== 'explorar' || state.tab !== 'compare') lastCompareKey = '';
  main.innerHTML = views[state.section]();
  if (state.section === 'simular') updateSim();
  if (state.section === 'actividad') document.querySelector('#activity-search').value = state.filter.search;
  if (direction && !reduced.matches) {
    main.animate([{ opacity: 0, transform: `translateX(${direction * 22}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
    nav.querySelector('[aria-current] .nav-glyph').animate([{ transform: 'scale(.9)' }, { transform: 'scale(1.22) translateY(-2px)', offset: .48 }, { transform: 'scale(1)' }], { duration: 310 });
  }
  if (focus) main.querySelector(focus)?.focus({ preventScroll: true });
}

function navigate(id, push = true) {
  const old = sections.findIndex(s => s[0] === state.section);
  const next = sections.findIndex(s => s[0] === id);
  state.section = id;
  if (push && location.hash !== '#' + id) history.pushState({}, '', '#' + id);
  if (old !== next) window.scrollTo(0, 0);
  render({ direction: Math.sign(next - old) });
}
window.addEventListener('hashchange', () => navigate(getSection(), false));
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || !sections.some(s => link.hash === '#' + s[0]) || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  navigate(link.hash.slice(1));
  if (e.detail === 0) main.focus();
});

const scrollDetail = (id, keyboard) => {
  const target = document.getElementById(id);
  if (!target) return;
  if (keyboard) {
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
  if (keyboard || matchMedia('(max-width: 760px)').matches) target.scrollIntoView({ block: 'nearest', behavior: reduced.matches ? 'instant' : 'smooth' });
};
function movementDialog(m) {
  dialog.innerHTML = `<div class="dialog-head">${badgeIcon(categories[m.category].icon)}<form method="dialog"><button class="subtle-button icon-button" aria-label="Cerrar detalle">${icon('close')}</button></form></div>
    <p class="eyebrow">DETALLE DE MOVIMIENTO</p><h2 id="movement-title">${m.label}</h2><strong class="dialog-amount ${m.kind === 'income' ? 'positive' : ''}">${amount(m)}</strong>
    <dl><div><dt>Fecha</dt><dd>${dateText(m.month, m.day)} de 2026</dd></div><div><dt>Cuenta de origen</dt><dd>${account(m.account).label}</dd></div>
    ${m.to ? `<div><dt>Cuenta de destino</dt><dd>${account(m.to).label}</dd></div>` : ''}
    <div><dt>Categoría</dt><dd>${categories[m.category].label}</dd></div><div><dt>Tipo</dt><dd>${kindName[m.kind]}</dd></div></dl>`;
  dialog.showModal();
}
dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

main.addEventListener('click', e => {
  const target = e.target.closest('[data-action]');
  if (!target) return;
  const { action: id, value } = target.dataset;
  const key = e.detail === 0;
  const focus = key ? `[data-action="${id}"][data-value="${value}"]` : undefined;
  switch (id) {
    case 'kind': state.kind = value; state.opened = false; state.category = null; break;
    case 'day': state.day = Number(value); state.opened = true; state.category = null; render(); scrollDetail('day-detail', key); return;
    case 'category': state.category = state.category === value ? null : value; render({ focus }); if (state.category) scrollDetail('segment-detail', key); return;
    case 'compare-day': state.tab = 'compare'; state.compare = state.month === latest ? previous : latest; navigate('explorar'); if (key) main.focus(); return;
    case 'tab': state.tab = value; break;
    case 'explore': state.tab = 'days'; navigate('explorar'); if (key) main.focus(); return;
    case 'signal': state.kind = 'expense'; state.tab = 'days'; state.day = Number(value); state.opened = true; state.category = null; navigate('explorar'); scrollDetail('day-detail', key); return;
    case 'step': state.steps.add(value); if (value === 'explorar') { state.tab = 'days'; state.kind = 'expense'; state.day = daily(state.month).indexOf(Math.max(...daily(state.month))) + 1; state.opened = true; state.category = null; } navigate(value); if (key) main.focus(); return;
    case 'account': state.filter = { account: value, kind: '', search: '' }; navigate('actividad'); if (key) main.focus(); return;
    case 'movement': movementDialog(movements.find(m => m.id === value)); return;
    case 'swap': [state.month, state.compare] = [state.compare, state.month]; break;
    case 'pick-compare': state.day = Number(value); break;
    case 'route': state.selectedRoute = state.selectedRoute === value ? null : value; break;
    case 'reset': state.dates = defaultDates(); state.event = 'cobro'; updateSim(); return;
    case 'nudge': state.dates[state.event] = Math.min(30, Math.max(1, state.dates[state.event] + Number(value))); updateSim(); return;
    default: return;
  }
  render({ focus });
});

main.addEventListener('change', e => {
  const { value, dataset: { change: id } } = e.target;
  switch (id) {
    case 'month': state.month = value; state.day = Math.min(state.day, months[value].days); state.opened = false; state.category = null; state.selectedRoute = null; break;
    case 'base-month': state.month = value; break;
    case 'other-month': state.compare = value; break;
    case 'compare-kind': state.kind = value; break;
    case 'compare-day-select': state.day = Number(value); break;
    case 'flow-select': state.selectedRoute = value || null; break;
    case 'filter-kind': state.filter.kind = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    case 'filter-account': state.filter.account = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    case 'sim-event': state.event = value; updateSim(); return;
    case 'sim-day': state.dates[state.event] = Number(value); updateSim(); return;
    default: return;
  }
  render({ focus: `[data-change="${id}"]` });
});
main.addEventListener('input', e => {
  if (e.target.id !== 'activity-search') return;
  state.filter.search = e.target.value.trim();
  document.querySelector('#activity-results').innerHTML = activityResults();
});

let drag = null;
main.addEventListener('pointerdown', e => {
  const btn = e.target.closest('[data-event], [data-month-drag]');
  if (!btn || e.button !== 0) return;
  drag = { btn, pointer: e.pointerId, x: e.clientX, event: btn.dataset.event, month: btn.dataset.monthDrag };
  btn.setPointerCapture(e.pointerId);
  if (drag.event) {
    state.event = drag.event; updateSim(false);
  }
  btn.classList.add('dragging');
});
main.addEventListener('pointermove', e => {
  if (drag?.pointer !== e.pointerId) return;
  if (drag.event && (drag.moved || Math.abs(e.clientX - drag.x) > 3)) {
    drag.moved = true;
    const rect = document.querySelector('#event-timeline').getBoundingClientRect();
    state.dates[drag.event] = Math.min(30, Math.max(1, 1 + Math.round(29 * (e.clientX - rect.left) / rect.width)));
    updateSim(false);
  } else if (drag.month !== undefined) {
    drag.btn.style.transform = `translateX(${e.clientX - drag.x}px)`;
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-month-target]');
    for (const el of main.querySelectorAll('[data-month-target]')) el.classList.toggle('drop-ready', el === hit && !el.contains(drag.btn));
  }
});
for (const name of ['pointerup', 'pointercancel']) main.addEventListener(name, e => {
  if (drag?.pointer !== e.pointerId) return;
  const { btn, event, month } = drag;
  btn.classList.remove('dragging');
  btn.style.transform = '';
  drag = null;
  if (event) {
    const notice = document.querySelector('#sim-notice');
    notice.innerHTML = '';
    updateSim();
  } else if (month !== undefined) {
    const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-month-target]');
    if (name === 'pointerup' && hit && !hit.contains(btn)) {
      [state.month, state.compare] = [state.compare, state.month];
      render();
    } else {
      for (const el of main.querySelectorAll('[data-month-target]')) el.classList.remove('drop-ready');
    }
  }
});
main.addEventListener('click', e => {
  const btn = e.target.closest('[data-event]');
  if (btn && e.detail === 0) { state.event = btn.dataset.event; updateSim(); }
});
main.addEventListener('keydown', e => {
  const btn = e.target.closest('[data-event]');
  if (!btn || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  state.event = btn.dataset.event;
  state.dates[state.event] = e.key === 'Home' ? 1 : e.key === 'End' ? 30 : Math.min(30, Math.max(1, state.dates[state.event] + (e.key === 'ArrowRight' ? 1 : -1)));
  updateSim();
});
reduced.addEventListener('change', () => {
  if (state.section === 'explorar' && state.tab === 'flow') render();
});
render();
requestAnimationFrame(() => nav.classList.add('nav-ready'));
