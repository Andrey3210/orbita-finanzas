import { accounts, categories, expenses, months, latest, previous, movements, money, signed, sum, monthMovements, byDay, monthlyReport, balances, portfolio, daily, groups, compareDay, routes, predictNextMonth } from './model.js?v=foxio-5';
import { icon } from './icons.js?v=foxio-5';
import { createNavigation } from './navigation.js?v=foxio-5';

const sections = [
  ['inicio', 'Inicio', 'home', 'apricot'], ['cuentas', 'Cuentas', 'wallet', 'honey'], ['explorar', 'Explorar', 'compass', 'orange'],
  ['pronostico', 'Pronóstico', 'trend', 'cream'], ['actividad', 'Actividad', 'pulse', 'coral'],
];
function getSection() {
  const id = location.hash.slice(1);
  if (id === 'simular') return 'pronostico';
  return sections.some(s => s[0] === id) ? id : 'inicio';
}
const state = {
  section: getSection(), month: latest, day: 15, kind: 'expense', opened: false, category: null,
  tab: 'days', selectedRoute: null, spendingCategory: null,
  filter: { account: '', kind: '', search: '' }, reportOpen: false,
};
let lastCompareKey = '';
let lastBarsKey = '';
let lastFlowMonth = '';
let lastScene = '';
const main = document.querySelector('#content');
const nav = document.querySelector('#nav');
const dialog = document.querySelector('#movement-dialog');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const monthName = m => months[m].label;
const otherMonth = m => m === latest ? previous : latest;
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
const heading = (title, extra = '', summary = '') => {
  const [id, , glyph, color] = sections.find(s => s[0] === state.section);
  if (id === 'inicio') return `<header class="section-heading"><div class="section-title"><span class="section-figure tone-${color}">${icon(glyph, 29)}</span><h1>${title}</h1></div>${extra}</header>`;
  return `<header class="section-heading section-banner tone-${color}"><div class="section-banner-copy"><h1>${title}</h1>${summary}${extra}</div><div class="section-portrait">${mascot(id)}</div></header>`;
};
const badgeIcon = glyph => `<span class="badge-icon">${icon(glyph, 19)}</span>`;
const plotScale = kind => {
  const max = Math.max(...Object.keys(months).flatMap(m => daily(m, kind))) / 100;
  const step = max > 2000 ? 1500 : max > 800 ? 400 : 200;
  return Math.ceil(max / (step * 4)) * step * 4 * 100;
};

nav.insertAdjacentHTML('beforeend', sections.map(([id, label, glyph, color]) => `<a class="nav-link tone-${color}" href="#${id}" data-nav="${id}" draggable="false"><span class="nav-glyph">${icon(glyph, 22)}</span><span>${label}</span></a>`).join(''));
const navigation = createNavigation(nav, main, state.section, navigate);

const metric = (title, value, glyph, color, tone = '') => `<div class="metric">
  <span class="metric-icon tone-${color}">${icon(glyph, 17)}</span><div><span>${title}</span><strong class="${tone}">${value}</strong></div></div>`;
const mascot = section => `<img class="mascot mascot-${section}" src="./assets/zorro-${section}.webp?v=foxio-5" width="512" height="512" alt="" draggable="false">`;

function home() {
  const report = monthlyReport(state.month);
  return `${heading('Resumen', select('Mes del resumen', 'month', monthItems, state.month))}
  <div class="home-main">
    <section class="hero" aria-label="Saldo total">
      <div class="hero-balance"><span>Saldo total</span><strong>${money(report.closing)}</strong></div>
      <div class="hero-illustration"><i class="hero-orbit"></i><i class="hero-spark first">${icon('spark', 22)}</i><i class="hero-spark second">${icon('spark', 16)}</i>${mascot('inicio')}</div>
    </section>
    <section class="metrics" aria-label="Resumen del mes">
      ${metric('Ingresos', money(report.income), 'arrowDown', 'honey')}
      ${metric('Balance', signed(report.net), report.net < 0 ? 'trendDown' : 'trend', 'apricot', negative(report.net))}
    </section>
    ${spendingPanel(report)}
    ${dayPanel(true)}
    ${financialDetails(report)}
  </div>`;
}

function spendingPanel(report) {
  const selected = report.byCategory.find(group => group.category === state.spendingCategory);
  const shares = report.byCategory.map(group => group.cents / report.expense * 100);
  const percentages = shares.map(Math.floor);
  if (shares.length) {
    const remainder = 100 - percentages.reduce((total, value) => total + value, 0);
    const fractions = shares.map((share, index) => ({ index, fraction: share - percentages[index] }));
    fractions.sort((a, b) => b.fraction - a.fraction);
    for (const { index } of fractions.slice(0, remainder)) percentages[index]++;
  }
  let offset = 0;
  const slices = report.byCategory.map((group, index) => {
    const category = categories[group.category];
    const share = shares[index];
    const visible = Math.max(0, share - 1.25);
    const shape = `<circle class="donut-slice ${group === selected ? 'selected' : ''}" ${action('spending', group.category)} cx="100" cy="100" r="80" pathLength="100"
      stroke="${category.color}" stroke-dasharray="${visible} ${100 - visible}" stroke-dashoffset="${-offset - .625}"/>`;
    offset += share;
    return shape;
  }).join('');
  return `<section class="spending-panel" aria-labelledby="spending-title">
    <div class="panel-head"><h2 id="spending-title">Gastos por categoría</h2></div>
    <div class="spending-body ${selected ? 'has-selection' : ''}">
      <div class="donut">
        <svg class="donut-chart" viewBox="0 0 200 200" aria-hidden="true">
          <circle class="donut-track" cx="100" cy="100" r="80"/>
          <g transform="rotate(-90 100 100)">${slices}</g>
        </svg>
        <div class="donut-total" aria-live="polite"><span>${selected ? categories[selected.category].label : 'Total'}</span><strong>${money(selected?.cents ?? report.expense)}</strong></div>
      </div>
      <div class="spending-key" aria-label="Categorías">
        ${report.byCategory.map((group, index) => {
          const category = categories[group.category];
          const share = percentages[index] + '%';
          return `<button class="spending-key-row" ${action('spending', group.category)} aria-pressed="${group === selected}" aria-label="${category.label}, ${share}, ${money(group.cents)}">
            <i style="--tint:${category.color}"></i><span>${category.label}</span><strong>${share}</strong>
          </button>`;
        }).join('')}
      </div>
    </div>
  </section>`;
}

function selectSpendingCategory(category) {
  state.spendingCategory = category === state.spendingCategory ? null : category;
  const section = main.querySelector('.spending-body');
  const report = monthlyReport(state.month);
  const selected = report.byCategory.find(group => group.category === state.spendingCategory);
  section.classList.toggle('has-selection', Boolean(selected));
  for (const row of section.querySelectorAll('.spending-key-row')) {
    row.setAttribute('aria-pressed', String(row.dataset.value === selected?.category));
  }
  for (const slice of section.querySelectorAll('.donut-slice')) {
    slice.classList.toggle('selected', slice.dataset.value === selected?.category);
  }
  section.querySelector('.donut-total span').textContent = selected ? categories[selected.category].label : 'Total';
  section.querySelector('.donut-total strong').textContent = money(selected?.cents ?? report.expense);
}

function financialDetails(report) {
  const row = (label, value, tone = '') => `<div><dt>${label}</dt><dd class="${tone}">${value}</dd></div>`;
  const delta = (label, cents) => row(label, signed(cents));
  const monthDiff = report.prior
    ? `<dl>${delta('Ingresos', report.income - report.prior.income)}${delta('Gastos', report.expense - report.prior.expense)}${delta('Balance', report.net - (report.prior.income - report.prior.expense))}</dl>`
    : '<p class="empty">Es el primer mes de la demo.</p>';
  return `<details class="financial-report" ${state.reportOpen ? 'open' : ''}>
    <summary><span>${icon('bars', 19)} Resumen completo</span>${icon('chevronDown', 18)}</summary>
    <div class="report-body">
      <section><h2>Flujo del mes</h2><dl>
        ${row('Saldo inicial', money(report.opening))}${row('Ingresos', money(report.income))}${row('Gastos', '−' + money(report.expense))}
        ${row('Balance', signed(report.net), negative(report.net))}${row('Saldo final', money(report.closing))}${row('Transferencias propias', money(report.transfer))}${row('Movimientos', report.entries)}
      </dl></section>
      <section><h2>Saldos por cuenta</h2><dl>${accounts.map(a => row(a.label, signed(report.accountBalances[a.id]).replace(/^\+/, ''))).join('')}</dl></section>
      <section><h2>Gastos por categoría</h2><dl class="spend-categories">${report.byCategory.map(group => {
        const category = categories[group.category];
        const share = group.cents / report.expense * 100;
        return `<div><dt>${category.label}</dt><dd>${money(group.cents)}</dd><i style="--share:${share}%;--tint:${category.color}" aria-hidden="true"></i></div>`;
      }).join('')}</dl></section>
      <section><h2>${report.earlier ? 'Frente a ' + monthName(report.earlier).toLowerCase() : 'Comparación mensual'}</h2>${monthDiff}</section>
    </div></details>`;
}

function dayPanel(isHome = false) {
  const kind = isHome ? 'expense' : state.kind;
  const key = [state.section, state.month, kind].join('/');
  const reveal = lastBarsKey !== key;
  lastBarsKey = key;
  const values = daily(state.month, kind);
  const scale = plotScale(kind);
  const topDay = values.indexOf(Math.max(...values)) + 1;
  const day = Math.min(state.day, values.length);
  const list = byDay(state.month, day, kind);
  const breakdown = groups(list);
  const total = sum(list);
  const guides = [1, .75, .5, .25, 0];
  const labelDays = state.month === latest ? [1, 5, 10, 15, 20, 25, 31] : [1, 5, 10, 15, 20, 25, 30];
  const dayOptions = [['', 'Ir a un día'], ...values.map((_, i) => [String(i + 1), `${i + 1} ${months[state.month].short}`])];
  const dayPicker = select('Ir a un día', 'chart-day', dayOptions, state.opened ? String(day) : '');
  return `<section class="panel day-panel ${isHome ? 'home-chart' : ''}" aria-labelledby="day-title">
    <div class="panel-head"><div class="chart-title"><h2 id="day-title">${isHome ? 'Gastos por día' : 'Movimientos por día'}</h2><span class="plot-unit">S/</span></div>${isHome ? dayPicker : `<div class="chart-filters">${select('Tipo de movimiento', 'kind', Object.entries(kindName), kind)}${select('Mes del gráfico', 'month', monthItems, state.month)}${dayPicker}</div>`}</div>
    <div class="bar-figure ${state.opened ? 'drilling' : ''} ${reveal ? 'bars-enter' : ''}">
      <div class="y-labels" aria-hidden="true">${guides.map(g => `<span>${num(scale * g / 100)}</span>`).join('')}</div>
      <div class="bar-scroll" data-chart-key="${key}" role="region" aria-label="Barras por día, desplazamiento horizontal">
      <div class="bar-plot" style="--days:${values.length}">
        <div class="grid-lines" aria-hidden="true">${guides.map(() => '<i></i>').join('')}</div>
        ${values.map((cents, i) => {
          const d = i + 1, highlighted = d === (state.opened ? day : topDay);
          const split = state.opened && highlighted && breakdown.length > 0;
          const height = cents / scale * 100;
          return `<div class="bar-cell ${highlighted ? 'highlighted' : ''} ${split ? 'split' : ''}" style="--height:${height}%;--column:${i}">
            <button class="bar-hit" ${action('day', d)} aria-label="${dateText(state.month, d)}: ${money(cents)}" aria-pressed="${state.opened && day === d}">
              <span class="bar-solid ${cents === 0 ? 'zero' : ''}"></span>
              ${highlighted && !state.opened && cents > 0 ? `<span class="peak-label" aria-hidden="true">${d} ${months[state.month].short.toUpperCase()} <b>${money(cents)}</b></span>` : ''}
              <span class="x-tick ${labelDays.includes(d) ? '' : 'is-minor'}" aria-hidden="true">${d}</span>
            </button>
            ${split ? `<div class="bar-split" aria-hidden="true">${breakdown.map(g => `<span class="${g.category === state.category ? 'selected' : ''}" style="--share:${g.cents};--tint:${categories[g.category].color}"></span>`).join('')}</div>` : ''}
          </div>`;
        }).join('')}
      </div></div>
    </div>
    ${state.opened ? `<div class="day-detail" id="day-detail">
      <div class="detail-head"><div><p class="day-caption">${dateText(state.month, day)}</p><h3>${money(total)}</h3></div><button class="subtle-button" aria-label="Comparar este día" ${action('compare-day') }>${icon('layers', 15)} Comparar</button></div>
      ${breakdown.length ? `<div class="category-grid">${breakdown.map(g => `<button class="category-tile" style="--tint:${categories[g.category].color}" ${action('category', g.category)} aria-pressed="${state.category === g.category}"><i></i><span>${categories[g.category].label}</span><strong>${money(g.cents)}</strong>${icon('chevron', 14)}</button>`).join('')}</div>` : '<p class="empty">No hay movimientos de este tipo en este día.</p>'}
      ${state.category && breakdown.some(g => g.category === state.category) ? `<div class="unfold" id="segment-detail">${movementList(breakdown.find(g => g.category === state.category).items)}</div>` : ''}
    </div>` : ''}
  </section>`;
}

function movementList(items) {
  return items.length ? `<div class="movement-list">${items.map(m => `<button class="movement" ${action('movement', m.id)}><span class="movement-icon" style="--tint:${categories[m.category].color}">${icon(categories[m.category].icon, 17)}</span><span class="movement-copy"><strong>${m.label}</strong><small>${dateText(m.month, m.day)} · ${account(m.account).short}${m.to ? ' → ' + account(m.to).short : ''}</small></span><strong class="movement-amount ${m.kind === 'income' ? 'positive' : ''}">${amount(m)}</strong>${icon('chevron', 14)}</button>`).join('')}</div>` : '<p class="empty">No encontramos movimientos para estos filtros.</p>';
}

function accountsView() {
  const b = balances(state.month);
  const summary = `<p class="account-overview">Saldo total <strong>${money(portfolio(state.month))}</strong></p>`;
  return heading('Tus cuentas', select('Mes de las cuentas', 'month', monthItems, state.month), summary)
    + `<div class="account-grid">${accounts.map(a => `<button class="account-row" style="--tint:${a.color}" ${action('account', a.id)} aria-label="Ver movimientos de ${a.label}">
      <span class="movement-icon">${icon(a.icon, 23)}</span><span><strong>${a.label}</strong><small>•••• ${a.suffix}</small></span><strong>${signed(b[a.id]).replace(/^\+/, '')}</strong>${icon('chevron', 16)}</button>`).join('')}</div>
    <section class="panel block"><div class="panel-head"><h2>Entre tus cuentas</h2></div>${movementList(monthMovements(state.month).filter(m => m.kind === 'transfer'))}</section>`;
}

function explore() {
  return heading('Explorar')
    + `<div class="view-tabs" aria-label="Vistas de exploración">${[['days', 'bars', 'Por día'], ['compare', 'layers', 'Comparar meses'], ['flow', 'flow', 'Flujo de dinero']].map(([id, glyph, label]) => `<button ${action('tab', id)} aria-pressed="${state.tab === id}">${icon(glyph, 17)} ${label}</button>`).join('')}</div>`
    + (state.tab === 'days' ? dayPanel() : state.tab === 'compare' ? comparePanel() : flowPanel());
}

const pathOf = points => points.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' ');
function comparePanel() {
  const reference = otherMonth(state.month);
  const a = daily(state.month, state.kind), b = daily(reference, state.kind);
  const scale = plotScale(state.kind), d = state.day, diff = compareDay(state.month, reference, d, state.kind);
  const x = i => i * 600 / 30, y = n => 176 - n * 166 / scale;
  const points = values => values.map((v, i) => [x(i), y(v)]);
  const lineA = points(a), lineB = points(b);
  const n = Math.min(a.length, b.length);
  const area = pathOf([...lineA.slice(0, n), ...lineB.slice(0, n).reverse()]) + 'Z';
  // Per interval, the two strokes may cross. Clip the shared area to two masks so each sign stays legible.
  const above = line => pathOf([...line, [line.at(-1)[0], 0], [0, 0]]) + 'Z';
  const below = line => pathOf([...line, [line.at(-1)[0], 180], [0, 180]]) + 'Z';
  const daySelector = select('Día para comparar', 'compare-day-select', Array.from({ length: 31 }, (_, i) => [String(i + 1), 'Día ' + (i + 1)]), String(d));
  const key = [state.month, state.kind].join('/');
  const reveal = lastCompareKey !== key;
  lastCompareKey = key;
  return `<section class="panel block compare-panel">
    <div class="panel-head"><h2>Comparación</h2>${select('Tipo de movimiento', 'kind', Object.entries(kindName), state.kind)}</div>
    <div class="compare-controls">
      <div class="compare-control base" data-month-target><span class="drag-chip" title="Arrastrar ${monthName(state.month)}" data-month-drag aria-hidden="true">⋮⋮</span>${select('Mes base', 'month', monthItems, state.month)}</div>
      <div class="compare-control ref" data-month-target><span class="drag-chip" title="Arrastrar ${monthName(reference)}" data-month-drag aria-hidden="true">⋮⋮</span><span class="compare-label">${monthName(reference)} 2026</span></div>
    </div>
    <div class="compare-key"><span><i></i>${monthName(state.month)}</span><span class="reference"><i></i>${monthName(reference)}</span><span class="plot-unit">PEN / DÍA</span></div>
    <div class="line-figure"><div class="y-labels" aria-hidden="true">${[1,.75,.5,.25,0].map(t => `<span>${num(scale * t / 100)}</span>`).join('')}</div>
      <div class="line-plot">
      <svg viewBox="-3 0 606 180" preserveAspectRatio="none" role="img" aria-label="Curvas de ${kindName[state.kind].toLowerCase()} por día en la misma escala">
        <defs><clipPath id="above-a"><path d="${above(lineA)}"/></clipPath><clipPath id="below-a"><path d="${below(lineA)}"/></clipPath></defs>
        ${[10,51.5,93,134.5,176].map(n => `<path class="svg-grid" d="M0 ${n}H600"/>`).join('')}
        <g class="${reveal ? 'chart-sweep' : ''}"><path d="${area}" clip-path="url(#below-a)" fill="#ffb166" opacity=".23"/><path d="${area}" clip-path="url(#above-a)" fill="#ffe6d0" opacity=".23"/>
        <path d="${pathOf(lineB)}" class="reference-line"/><path d="${pathOf(lineA)}" class="current-line"/></g>
        <path d="M${x(d - 1)} 7V177" class="guide-line"/>
        ${[[a, '#ffb166'], [b, '#ffe6d0']].map(([values, color]) => values[d - 1] === undefined ? '' : `<circle class="chart-marker" cx="${x(d - 1)}" cy="${y(values[d - 1])}" r="3.5" fill="${color}" stroke="#340c04"/>`).join('')}
      </svg>
      <div class="compare-hits" aria-hidden="true">${Array.from({ length: 31 }, (_, i) => `<button tabindex="-1" ${action('pick-compare', i + 1)} title="Día ${i + 1}"></button>`).join('')}</div>
      <div class="line-days" aria-hidden="true">${[1,5,10,15,20,25,31].map(n => `<span style="left:${(n - 1) / 30 * 100}%">${String(n).padStart(2, '0')}</span>`).join('')}</div>
      </div></div>
    <div class="compare-detail"><div class="detail-head"><div><p class="eyebrow">DIFERENCIA / DÍA ${d}</p><h3>${diff ? signed(diff.delta) : 'Sin día equivalente'}</h3></div>${daySelector}</div>
    ${diff ? `<p>${monthName(state.month)}: <strong>${money(diff.left)}</strong> · ${monthName(reference)}: <strong>${money(diff.right)}</strong></p>
    ${diff.diffs.length ? `<div class="category-grid">${diff.diffs.map(({ category, delta }) => `<div class="category-tile" style="--tint:${categories[category].color}"><i></i><span>${categories[category].label}</span><strong>${signed(delta)}</strong></div>`).join('')}</div>` : '<p class="empty">Las categorías no registran diferencias ese día.</p>'}` : '<p>Uno de los meses no tiene día 31. El gráfico muestra los datos disponibles.</p>'}
    </div>
  </section>`;
}

function flowPanel() {
  const all = routes(state.month);
  const reveal = lastFlowMonth !== state.month;
  lastFlowMonth = state.month;
  const sources = accounts.filter(a => all.some(r => r.account === a.id));
  const sinks = expenses.filter(c => all.some(r => r.category === c));
  const active = all.find(r => r.id === state.selectedRoute);
  const grand = sum(all);
  const measure = cents => cents / grand * 87;
  const totalAt = (key, id) => sum(all.filter(r => r[key] === id));
  const position = (items, id) => items.length === 1 ? 136 : 34 + items.indexOf(id) * 204 / (items.length - 1);
  const nodeStyle = (items, key, id, color) => `--y:${position(items, id) / 272 * 100}%;--node-size:${Math.max(12, measure(totalAt(key, id))) / 272 * 100}%;--tint:${color}`;
  const distribute = (items, id, key) => {
    const subset = all.filter(r => r[key] === id);
    let cursor = position(items, id);
    cursor -= subset.reduce((n, r) => n + measure(r.cents), 0) / 2;
    return Object.fromEntries(subset.map(r => {
      const w = measure(r.cents), center = cursor + w / 2;
      cursor += w;
      return [r.id, center];
    }));
  };
  return `<section class="panel block flow-panel"><div class="panel-head"><h2>Sigue el dinero</h2>${select('Mes del flujo', 'month', monthItems, state.month)}</div>
    <div class="flow-captions"><span>Cuentas</span><span>Categorías</span></div>
    <div class="flow-figure">
      <div class="flow-nodes from">${sources.map(a => `<div style="${nodeStyle(sources.map(s => s.id), 'account', a.id, a.color)}"><span>${a.short}</span><i></i></div>`).join('')}</div>
      <svg viewBox="0 0 500 272" preserveAspectRatio="none" aria-label="Rutas de gastos de izquierda a derecha">
        ${[100,200,300,400].map(x => `<path class="svg-grid" d="M${x} 0V272"/>`).join('')}
        <g class="${reveal ? 'chart-sweep' : ''}">${all.map(r => {
          const sy = distribute(sources.map(a => a.id), r.account, 'account')[r.id], ty = distribute(sinks, r.category, 'category')[r.id];
          const d = `M0 ${sy} C180 ${sy},320 ${ty},500 ${ty}`, color = categories[r.category].color;
          const selected = active?.id === r.id;
          return `<g class="flow-route ${active && !selected ? 'dim' : ''} ${selected ? 'lit' : ''}" ${action('route', r.id)}><title>${account(r.account).label} → ${categories[r.category].label}: ${money(r.cents)}</title>
            <path d="${d}" fill="none" stroke="${color}" stroke-width="${measure(r.cents)}"/><path class="flow-hit" d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(12, measure(r.cents))}"/>
            ${reduced.matches ? '' : `<circle r="2.7" fill="#fff4e8" aria-hidden="true"><animateMotion dur="${2.6 + ty / 165}s" begin="-${sy / 110}s" repeatCount="indefinite" path="${d}"/></circle>`}</g>`;
        }).join('')}</g>
      </svg>
      <div class="flow-nodes to">${sinks.map(c => `<div style="${nodeStyle(sinks, 'category', c, categories[c].color)}"><i></i><span>${categories[c].label}</span></div>`).join('')}</div>
    </div>
    <div class="flow-controls">${select('Ruta de dinero', 'flow-select', [['', 'Todas las rutas'], ...all.map(r => [r.id, account(r.account).short + ' → ' + categories[r.category].label])], active?.id ?? '')}<span>${all.length} rutas · ${money(grand)} en gastos</span></div>
    <div id="flow-detail">${flowDetail(active)}</div>
  </section>`;
}

function flowDetail(route) {
  if (!route) return '';
  return `<div class="unfold"><div class="detail-head"><div><p class="eyebrow">${account(route.account).label} → ${categories[route.category].label}</p><h3>${money(route.cents)}</h3></div></div>${movementList(route.items)}</div>`;
}

function selectFlowRoute(id) {
  state.selectedRoute = id || null;
  for (const route of main.querySelectorAll('.flow-route')) {
    const selected = route.dataset.value === id;
    route.classList.toggle('lit', selected);
    route.classList.toggle('dim', Boolean(id) && !selected);
  }
  main.querySelector('[data-change="flow-select"]').value = id || '';
  main.querySelector('#flow-detail').innerHTML = flowDetail(routes(state.month).find(route => route.id === id));
}

function forecastView() {
  const report = predictNextMonth();
  if (!report) return heading('Pronóstico') + '<p class="empty">Aún no hay historial para hacer un pronóstico.</p>';

  const { date, series, opening, closing, net, income, expense, history, shortfall } = report;
  const period = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  const periodName = period.charAt(0).toUpperCase() + period.slice(1);
  const days = series.length - 1;
  const amounts = series.map(point => point.balance);
  const low = Math.min(...amounts), high = Math.max(...amounts);
  const step = Math.max(50000, Math.ceil((high - low) / 200000) * 50000);
  const floor = Math.floor(low / step) * step;
  const ceiling = Math.max(floor + step, Math.ceil(high / step) * step);
  const ticks = Array.from({ length: (ceiling - floor) / step + 1 }, (_, i) => ceiling - i * step);
  const x = day => day * 600 / days;
  const y = balance => 174 - (balance - floor) / (ceiling - floor) * 163;
  const points = series.map(point => [x(point.day), y(point.balance)]);
  const line = pathOf(points);
  const area = line + ' L600 174 L0 174 Z';
  const historyNames = history.map(key => monthName(key).toLowerCase()).join(' y ');
  const note = history.length === 2
    ? `Historial de ${historyNames} · ${monthName(history.at(-1)).toLowerCase()} cuenta doble.`
    : `Basado en los movimientos de ${historyNames}.`;

  return heading('Pronóstico', `<span class="forecast-period">${periodName}</span>`,
    `<p class="account-overview">Saldo estimado al cierre <strong>${signed(closing).replace(/^\+/, '')}</strong><small class="${negative(net)}">${signed(net)} frente al saldo actual</small></p>`)
    + `<div class="forecast-main"><section class="forecast-metrics" aria-label="Ingresos y gastos estimados">
        ${metric('Ingresos estimados', money(income), 'arrowDown', 'honey')}
        ${metric('Gastos estimados', money(expense), 'arrowUp', 'coral')}
      </section>
      <section class="panel block forecast-panel" aria-labelledby="forecast-title">
        <div class="panel-head"><h2 id="forecast-title">Saldo durante el mes</h2><span class="plot-unit">PEN</span></div>
        <div class="compare-key"><span><i></i>Estimado</span><span class="reference"><i></i>Saldo actual · ${money(opening)}</span></div>
        <div class="line-figure forecast-figure"><div class="y-labels" aria-hidden="true">${ticks.map(tick => `<span style="top:${y(tick) / 180 * 100}%">${tick < 0 ? '−' : ''}${num(Math.abs(tick) / 100)}</span>`).join('')}</div>
          <div class="line-plot">
            <svg viewBox="-3 0 606 180" preserveAspectRatio="none" role="img" aria-label="Saldo estimado desde ${money(opening)} hasta ${signed(closing).replace(/^\+/, '')} el día ${days}">
              ${ticks.map(tick => `<path class="svg-grid" d="M0 ${y(tick)}H600"/>`).join('')}
              <path class="reference-line" d="M0 ${y(opening)}H600"/>
              <g class="chart-sweep"><path class="forecast-area" d="${area}"/><path class="current-line" id="forecast-line" d="${line}"/><circle cx="600" cy="${y(closing)}" r="4" class="forecast-point"/></g>
            </svg>
            <div class="line-days" aria-hidden="true">${[0, 5, 10, 15, 20, 25, days].map(day => `<span style="left:${day / days * 100}%">${day || 'Inicio'}</span>`).join('')}</div>
          </div>
        </div>
        ${shortfall ? `<p class="negative">Primer saldo estimado bajo cero el día ${shortfall.day} · ${signed(shortfall.balance)}</p>` : ''}
        <p class="forecast-note">${note}</p>
      </section></div>`;
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
  return heading('Actividad', select('Mes de actividad', 'month', monthItems, state.month))
    + `<section class="panel block activity-panel">
    <label class="search-wrap">${icon('search', 17)}<span class="sr-only">Buscar movimientos</span><input type="search" id="activity-search" placeholder="Buscar un movimiento"></label>
    <details class="activity-filters" ${state.filter.account || state.filter.kind ? 'open' : ''}><summary>Filtros ${icon('chevronDown', 14)}</summary><div class="filter-row">
    ${select('Filtrar por cuenta', 'filter-account', [['', 'Todas las cuentas'], ...accounts.map(a => [a.id, a.label])], state.filter.account)}
    ${select('Filtrar por tipo', 'filter-kind', [['', 'Todos los tipos'], ...Object.entries(kindName)], state.filter.kind)}</div></details>
    <div id="activity-results">${activityResults()}</div></section>`;
}

const views = { inicio: home, cuentas: accountsView, explorar: explore, pronostico: forecastView, actividad: activity };
let pageTransition;
function render({ focus, direction = 0, centerDay = false } = {}) {
  const previousChart = main.querySelector('.bar-scroll');
  const chartPosition = previousChart && { key: previousChart.dataset.chartKey, left: previousChart.scrollLeft };
  const report = main.querySelector('.financial-report');
  if (report) state.reportOpen = report.open;
  if (state.section !== 'explorar' || state.tab !== 'compare') lastCompareKey = '';
  if (state.section !== 'inicio' && (state.section !== 'explorar' || state.tab !== 'days')) lastBarsKey = '';
  if (state.section !== 'explorar' || state.tab !== 'flow') lastFlowMonth = '';
  main.classList.toggle('scene-enter', lastScene !== state.section);
  lastScene = state.section;
  pageTransition?.cancel();
  main.innerHTML = views[state.section]();
  const chart = main.querySelector('.bar-scroll');
  if (chart && chart.scrollWidth > chart.clientWidth) {
    if (!centerDay && chartPosition?.key === chart.dataset.chartKey) {
      chart.scrollLeft = chartPosition.left;
    } else {
      const cell = chart.querySelector('.bar-cell.highlighted');
      if (cell) chart.scrollLeft = cell.offsetLeft + (cell.offsetWidth - chart.clientWidth) / 2;
    }
  }
  if (state.section === 'actividad') document.querySelector('#activity-search').value = state.filter.search;
  if (direction && !reduced.matches) {
    pageTransition = main.animate([
      { opacity: .25, transform: `translateX(${direction * 32}px) scale(.991)` },
      { opacity: 1, transform: `translateX(${-direction * 2}px)`, offset: .82 },
      { opacity: 1, transform: 'none' },
    ], { duration: 345, easing: 'cubic-bezier(.2,.74,.25,1)' });
  }
  if (focus) main.querySelector(focus)?.focus({ preventScroll: true });
}

function navigate(id, push = true) {
  const old = sections.findIndex(s => s[0] === state.section);
  const next = sections.findIndex(s => s[0] === id);
  state.section = id;
  navigation.select(id);
  if (push && location.hash !== '#' + id) history.pushState({}, '', '#' + id);
  if (old !== next) window.scrollTo(0, 0);
  render({ direction: Math.sign(next - old) });
}
window.addEventListener('hashchange', () => navigate(getSection(), false));
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link || !sections.some(s => link.hash === '#' + s[0]) || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  if (state.section !== link.hash.slice(1)) navigate(link.hash.slice(1));
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
    <h2 id="movement-title">${m.label}</h2><strong class="dialog-amount ${m.kind === 'income' ? 'positive' : ''}">${amount(m)}</strong>
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
    case 'spending': selectSpendingCategory(value); return;
    case 'day':
      if (state.section === 'inicio') state.kind = 'expense';
      state.day = Number(value); state.opened = true; state.category = null;
      render(); scrollDetail('day-detail', key); return;
    case 'category': state.category = state.category === value ? null : value; render({ focus }); if (state.category) scrollDetail('segment-detail', key); return;
    case 'compare-day': state.tab = 'compare'; state.day = Math.min(state.day, months[state.month].days); navigate('explorar'); if (key) main.focus(); return;
    case 'tab': {
      if (state.tab === value) return;
      const tabs = ['days', 'compare', 'flow'];
      const direction = Math.sign(tabs.indexOf(value) - tabs.indexOf(state.tab));
      state.tab = value;
      render({ focus });
      if (!reduced.matches) main.querySelector('.panel').animate([
        { opacity: .3, transform: `translateX(${direction * 14}px)` }, { opacity: 1, transform: 'none' },
      ], { duration: 230, easing: 'ease-out' });
      return;
    }
    case 'account': state.filter = { account: value, kind: '', search: '' }; navigate('actividad'); if (key) main.focus(); return;
    case 'movement': movementDialog(movements.find(m => m.id === value)); return;
    case 'pick-compare': state.day = Number(value); break;
    case 'route': selectFlowRoute(state.selectedRoute === value ? null : value); return;
    default: return;
  }
  render({ focus });
});

main.addEventListener('change', e => {
  const { value, dataset: { change: id } } = e.target;
  switch (id) {
    case 'month':
      state.month = value;
      state.day = Math.min(state.day, months[value].days);
      state.opened = false; state.category = null; state.selectedRoute = null; state.spendingCategory = null;
      break;
    case 'chart-day':
      if (value) state.day = Number(value);
      if (state.section === 'inicio') state.kind = 'expense';
      state.opened = Boolean(value); state.category = null;
      render({ focus: '[data-change="chart-day"]', centerDay: true });
      if (value) scrollDetail('day-detail', false);
      return;
    case 'kind': state.kind = value; state.opened = false; state.category = null; break;
    case 'compare-day-select': state.day = Number(value); break;
    case 'flow-select': selectFlowRoute(value); return;
    case 'filter-kind': state.filter.kind = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    case 'filter-account': state.filter.account = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
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
  const btn = e.target.closest('[data-month-drag]');
  if (!btn || e.button !== 0) return;
  drag = { btn, pointer: e.pointerId, x: e.clientX, y: e.clientY };
  btn.setPointerCapture(e.pointerId);
  btn.classList.add('dragging');
});
main.addEventListener('pointermove', e => {
  if (drag?.pointer !== e.pointerId) return;
  drag.btn.style.transform = `translate(${e.clientX - drag.x}px, ${e.clientY - drag.y}px)`;
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-month-target]');
  for (const el of main.querySelectorAll('[data-month-target]')) el.classList.toggle('drop-ready', el === hit && !el.contains(drag.btn));
});
for (const name of ['pointerup', 'pointercancel']) main.addEventListener(name, e => {
  if (drag?.pointer !== e.pointerId) return;
  const { btn } = drag;
  btn.classList.remove('dragging');
  btn.style.transform = '';
  drag = null;
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-month-target]');
  if (name === 'pointerup' && hit && !hit.contains(btn)) {
    state.month = otherMonth(state.month);
    state.spendingCategory = null;
    render();
  } else {
    for (const el of main.querySelectorAll('[data-month-target]')) el.classList.remove('drop-ready');
  }
});
reduced.addEventListener('change', () => {
  if (state.section === 'explorar' && state.tab === 'flow') render();
});
render();
