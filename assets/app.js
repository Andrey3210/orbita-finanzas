import { accounts, categories, expenses, months, newestMonth, period, shiftMonth, movements, money, signed, sum, monthMovements, byDay, monthlyReport, balances, portfolio, daily, groups, compareDay, routes, predictNextMonth } from './model.js?v=miluka-2';
import { icon } from './icons.js?v=miluka-2';
import { createNavigation } from './navigation.js?v=miluka-2';
import { localDate, reserved, syncPersonal } from './personal.js?v=miluka-2';
import { createModules, escapeText } from './modules.js?v=miluka-2';

const sections = [
  ['inicio', 'Inicio', 'home', 'apricot'], ['organiza', 'Organízate', 'wallet', 'honey'], ['explorar', 'Explorar', 'compass', 'orange'],
  ['metas', 'Metas', 'target', 'cream'], ['asistente', 'Asistente', 'chat', 'coral'],
];
function getSection() {
  const id = location.hash.slice(1);
  if (id === 'simular' || id === 'pronostico') return 'asistente';
  if (id === 'cuentas' || id === 'actividad') return 'organiza';
  return sections.some(s => s[0] === id) ? id : 'inicio';
}
const state = {
  section: getSection(), month: newestMonth(), day: 15, kind: 'expense', opened: false, category: null,
  tab: 'days', explore: 'retos', organize: location.hash === '#actividad' ? 'historial' : 'cuentas',
  selectedRoute: null, spendingCategory: null, calendarMonth: localDate().slice(0, 7),
  filter: { account: '', kind: '', search: '', category: '', date: '' }, reportOpen: false,
};
let lastCompareKey = '';
let lastBarsKey = '';
let lastFlowMonth = '';
let lastScene = '';
const main = document.querySelector('#content');
const nav = document.querySelector('#nav');
const dialog = document.querySelector('#movement-dialog');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const monthName = m => months[m]?.label ?? period(m).label;
const otherMonth = m => shiftMonth(m, -1) in months ? shiftMonth(m, -1) : Object.keys(months).filter(key => key !== m).sort().at(-1);
const inHistory = () => state.section === 'organiza' && state.organize === 'historial';
const kindName = { expense: 'Gastos', income: 'Ingresos', transfer: 'Transferencias' };
const account = id => accounts.find(a => a.id === id);
const dateText = (m, day) => `${day} de ${monthName(m).toLowerCase()}`;
const amount = m => (m.kind === 'expense' ? '−' : m.kind === 'income' ? '+' : '') + money(m.cents);
const negative = cents => cents < 0 ? 'negative' : 'positive';
const num = (n, places = 0) => new Intl.NumberFormat('en-PE', { minimumFractionDigits: places, maximumFractionDigits: places }).format(n);
const option = (value, label, selected) => `<option value="${escapeText(value)}" ${value === selected ? 'selected' : ''}>${escapeText(label)}</option>`;
const action = (id, value = '') => `data-action="${id}" data-value="${value}"`;
const select = (label, id, items, selected, extra = '') => `<span class="select-wrap ${extra}">${icon(id.includes('month') ? 'calendar' : 'layers', 15)}<select aria-label="${label}" data-change="${id}">${items.map(([v, l]) => option(v, l, selected)).join('')}</select>${icon('chevronDown', 13)}</span>`;
const monthItems = () => {
  const keys = Object.keys(months).sort().reverse();
  const multiYear = new Set(keys.map(key => key.slice(0, 4))).size > 1;
  return keys.map(key => [key, monthName(key) + (multiYear ? ' ' + key.slice(0, 4) : '')]);
};
const heading = (title, extra = '', summary = '') => {
  const [id, , , color] = sections.find(s => s[0] === state.section);
  if (id === 'inicio') return `<header class="section-heading"><div class="section-title"><h1>${title}</h1></div>${extra}</header>`;
  return `<header class="section-heading section-banner tone-${color}"><div class="section-banner-copy"><h1>${title}</h1>${summary}${extra}</div><div class="section-portrait">${mascot(id)}</div></header>`;
};
const badgeIcon = glyph => `<span class="badge-icon">${icon(glyph, 19)}</span>`;
const axisStep = target => {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, target)));
  return Math.ceil([1, 2, 2.5, 5, 10].find(step => step * magnitude >= target) * magnitude);
};
const plotScale = kind => {
  const max = Math.max(...Object.keys(months).map(m => Math.max(...daily(m, kind)))) / 100;
  return axisStep(max / 4) * 400;
};

nav.insertAdjacentHTML('beforeend', sections.map(([id, label, glyph, color]) => `<a class="nav-link tone-${color}" href="#${id}" data-nav="${id}" draggable="false"><span class="nav-glyph">${icon(glyph, 22)}</span><span>${label}</span></a>`).join(''));
const navigation = createNavigation(nav, main, state.section, navigate);

const metric = (title, value, glyph, color, tone = '') => `<div class="metric">
  <span class="metric-icon tone-${color}">${icon(glyph, 17)}</span><div><span>${title}</span><strong class="${tone}">${value}</strong></div></div>`;
const mascot = section => `<img class="mascot mascot-${section}" src="./assets/miluka-${section}.webp?v=miluka-2" width="512" height="512" alt="" draggable="false">`;
const modules = createModules({ main, state, action, icon, select, heading, monthName, render, navigate, forecastView });

function home() {
  const report = monthlyReport(state.month);
  const reservedCents = state.month === newestMonth() ? reserved() : 0;
  return `${heading('Hola', select('Mes del resumen', 'month', monthItems(), state.month))}
  <div class="home-main">
    <section class="hero" aria-label="Saldo total">
      <div class="hero-balance"><span>Saldo total</span><strong><small>${report.closing < 0 ? '−' : ''}S/</small> ${money(report.closing).slice(3)}</strong>
      ${reservedCents ? `<span class="hero-available">Disponible ${signed(report.closing - reservedCents).replace(/^\+/, '')}</span>` : ''}</div>
      <div class="hero-illustration"><i class="hero-orbit"></i>${mascot('inicio')}</div>
    </section>
    <section class="home-indicators" aria-label="Ingresos y gastos del periodo">
      ${metric('Ingresos', money(report.income), 'arrowDown', 'honey', 'positive')}
      ${metric('Gastos', money(report.expense), 'arrowUp', 'coral')}
    </section>
    ${spendingPanel(report)}
    ${dayPanel(true)}
    ${modules.savingsPanel(state.month)}
    ${modules.upcomingPanel()}
    <a class="panel block quick-link" href="#asistente"><span>${icon('chat')} Pregunta a Miluka</span>${icon('chevron')}</a>
    ${financialDetails(report)}
  </div>`;
}

function spendingPanel(report) {
  const selected = report.byCategory.find(group => group.category === state.spendingCategory);
  const shares = report.byCategory.map(group => group.cents / report.expense * 100);
  const radius = 88;
  const weight = 17;
  const arc = `M24 103 A${radius} ${radius} 0 0 1 200 103`;
  // Reserve space for each round cap as well as the visible gap between slices.
  const gap = (weight + 2.5) * 100 / (Math.PI * radius);
  let offset = 0;
  const slices = report.byCategory.map((group, index) => {
    const category = categories[group.category];
    const share = shares[index];
    const padding = Math.min(gap, share * .55);
    const visible = share - padding;
    const shape = `<path class="donut-slice ${group === selected ? 'selected' : ''}" ${action('spending', group.category)} d="${arc}" pathLength="100"
      stroke="${category.color}" stroke-dasharray="${visible} ${100 - visible}" stroke-dashoffset="${-offset - padding / 2}"/>`;
    offset += share;
    return shape;
  }).join('');
  const keyRow = (group, index) => {
    const category = categories[group.category];
    const share = Math.round(shares[index]) + '%';
    return `<button class="spending-key-row" ${action('spending', group.category)} aria-pressed="${group === selected}" aria-label="${category.label}, ${share}, ${money(group.cents)}">
      <i style="--tint:${category.color}"></i><span>${category.label}</span><strong>${money(group.cents)}</strong>
    </button>`;
  };
  return `<section class="spending-panel" aria-labelledby="spending-title">
    <div class="panel-head"><h2 id="spending-title">Gastos</h2></div>
    <div class="spending-body ${selected ? 'has-selection' : ''}">
      <div class="donut">
        <svg class="donut-chart" viewBox="0 0 224 117" stroke-width="${weight}" stroke-linecap="round" aria-hidden="true">
          ${slices ? '' : `<path class="donut-track" d="${arc}"/>`}
          <g>${slices}</g>
        </svg>
        <div class="donut-total" aria-live="polite"><span>${selected ? categories[selected.category].label : ''}</span><strong>${money(selected?.cents ?? report.expense)}</strong></div>
      </div>
      <div class="spending-key" aria-label="Categorías">
        ${report.byCategory.slice(0, 2).map(keyRow).join('')}
        ${report.byCategory.length > 2 ? `<details class="category-disclosure" ${report.byCategory.indexOf(selected) > 1 ? 'open' : ''}><summary>Más categorías ${icon('chevronDown', 15)}</summary>${report.byCategory.slice(2).map((group, index) => keyRow(group, index + 2)).join('')}</details>` : ''}
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
    if (row.getAttribute('aria-pressed') === 'true' && row.closest('details')) row.closest('details').open = true;
  }
  for (const slice of section.querySelectorAll('.donut-slice')) {
    slice.classList.toggle('selected', slice.dataset.value === selected?.category);
  }
  section.querySelector('.donut-total span').textContent = selected ? categories[selected.category].label : '';
  section.querySelector('.donut-total strong').textContent = money(selected?.cents ?? report.expense);
}

function financialDetails(report) {
  const row = (label, value, tone = '') => `<div><dt>${label}</dt><dd class="${tone}">${value}</dd></div>`;
  const delta = (label, cents) => row(label, signed(cents));
  const monthDiff = report.prior
    ? `<dl>${delta('Ingresos', report.income - report.prior.income)}${delta('Gastos', report.expense - report.prior.expense)}${delta('Balance', report.net - (report.prior.income - report.prior.expense))}</dl>`
    : '<p class="empty">Sin historial del mes anterior.</p>';
  return `<details class="financial-report" ${state.reportOpen ? 'open' : ''}>
    <summary><span>${icon('bars', 19)} Resumen completo</span>${icon('chevronDown', 18)}</summary>
    <div class="report-body">
      <section><h2>Flujo del mes</h2><dl>
        ${row('Saldo inicial', money(report.opening))}${row('Ingresos', money(report.income))}${row('Gastos', '−' + money(report.expense))}
        ${row('Balance', signed(report.net), negative(report.net))}${row('Saldo final', money(report.closing))}${row('Transferencias propias', money(report.transfer))}${row('Movimientos', report.entries)}
      </dl></section>
      <section><h2>Saldos por cuenta</h2><dl>${accounts.map(a => row(escapeText(a.label), signed(report.accountBalances[a.id]).replace(/^\+/, ''))).join('')}</dl></section>
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
  const labelDays = [1, 5, 10, 15, 20, 25, values.length];
  const dayOptions = [['', 'Día'], ...values.map((_, i) => [String(i + 1), `${i + 1} ${months[state.month].short}`])];
  const dayPicker = select('Ir a un día', 'chart-day', dayOptions, state.opened ? String(day) : '');
  return `<section class="panel day-panel ${isHome ? 'home-chart' : ''}" aria-labelledby="day-title">
    <div class="panel-head"><div class="chart-title"><h2 id="day-title" aria-label="${isHome ? 'Gastos por día' : 'Movimientos por día'}">Por día</h2><span class="plot-unit">S/</span></div>${isHome ? dayPicker : `<div class="chart-filters">${select('Tipo de movimiento', 'kind', Object.entries(kindName), kind)}${select('Mes del gráfico', 'month', monthItems(), state.month)}${dayPicker}</div>`}</div>
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
              ${highlighted && !state.opened && cents > 0 ? `<span class="peak-label" aria-hidden="true">${money(cents)}</span>` : ''}
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
  return items.length ? `<div class="movement-list">${items.map(m => `<button class="movement" ${action('movement', m.id)}><span class="movement-icon" style="--tint:${categories[m.category].color}">${icon(categories[m.category].icon, 17)}</span><span class="movement-copy"><strong>${escapeText(m.label)}</strong><small>${dateText(m.month, m.day)} · ${escapeText(account(m.account).short)}${m.to ? ' → ' + escapeText(account(m.to).short) : ''}</small></span><strong class="movement-amount ${m.kind === 'income' ? 'positive' : ''}">${amount(m)}</strong>${icon('chevron', 14)}</button>`).join('')}</div>` : '<p class="empty">No encontramos movimientos para estos filtros.</p>';
}

function accountsView() {
  const b = balances();
  return `<section class="panel block"><div class="panel-head"><h2>Mis cuentas</h2><button class="subtle-button" ${action('form', 'account')}>${icon('plus', 16)} Cuenta</button></div>
    <p class="account-overview">Saldo disponible <strong>${signed(portfolio(newestMonth()) - reserved()).replace(/^\+/, '')}</strong></p>
    <div class="account-grid">${accounts.map(a => `<div class="account-entry"><button class="account-row" style="--tint:${a.color}" ${action('account', a.id)} aria-label="Ver movimientos de ${escapeText(a.label)}">
      <span class="movement-icon">${icon(a.icon, 23)}</span><span>${escapeText(a.label)}${reserved(a.id) ? `<small>${money(reserved(a.id))} en metas</small>` : ''}</span><strong>${signed(b[a.id] - reserved(a.id)).replace(/^\+/, '')}</strong></button>
      <button class="subtle-button icon-button account-edit" aria-label="Editar cuenta ${escapeText(a.label)}" ${action('account-edit', a.id)}>${icon('edit', 17)}</button></div>`).join('')}</div></section>`;
}

function explore() {
  return heading('Explorar')
    + modules.exploreTabs()
    + (state.explore === 'datos' ? `<div class="view-tabs chart-tabs" aria-label="Vistas de datos">${[['days', 'Días', 'Por día'], ['compare', 'Comparar', 'Comparar meses'], ['flow', 'Flujo', 'Flujo de dinero']].map(([id, label, fullLabel]) => `<button ${action('tab', id)} aria-label="${fullLabel}" aria-pressed="${state.tab === id}">${label}</button>`).join('')}</div>`
      + (state.tab === 'days' ? dayPanel() : state.tab === 'compare' ? comparePanel() : flowPanel()) : modules.learningView());
}

const pathOf = points => points.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2)).join(' ');
function comparePanel() {
  const reference = state.compareMonth && state.compareMonth !== state.month ? state.compareMonth : otherMonth(state.month);
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
  const key = [state.month, reference, state.kind].join('/');
  const reveal = lastCompareKey !== key;
  lastCompareKey = key;
  return `<section class="panel block compare-panel">
    <div class="panel-head"><h2>Comparación</h2>${select('Tipo de movimiento', 'kind', Object.entries(kindName), state.kind)}</div>
    <div class="compare-controls">
      <div class="compare-control base" data-month-target><span class="drag-chip" title="Arrastrar ${monthName(state.month)}" data-month-drag aria-hidden="true">⋮⋮</span>${select('Mes base', 'month', monthItems(), state.month)}</div>
      <div class="compare-control ref" data-month-target><span class="drag-chip" title="Arrastrar ${monthName(reference)}" data-month-drag aria-hidden="true">⋮⋮</span>${select('Mes de referencia', 'compare-month', monthItems().filter(([key]) => key !== state.month), reference)}</div>
    </div>
    <div class="compare-key"><span><i></i>${monthName(state.month)}</span><span class="reference"><i></i>${monthName(reference)}</span><span class="plot-unit">PEN / DÍA</span></div>
    <div class="line-figure"><div class="y-labels" aria-hidden="true">${[1,.75,.5,.25,0].map(t => `<span>${num(scale * t / 100)}</span>`).join('')}</div>
      <div class="line-plot">
      <svg viewBox="-3 0 606 180" preserveAspectRatio="none" role="img" aria-label="Curvas de ${kindName[state.kind].toLowerCase()} por día en la misma escala">
        <defs><clipPath id="above-a"><path d="${above(lineA)}"/></clipPath><clipPath id="below-a"><path d="${below(lineA)}"/></clipPath></defs>
        ${[10,51.5,93,134.5,176].map(n => `<path class="svg-grid" d="M0 ${n}H600"/>`).join('')}
        <g class="${reveal ? 'chart-sweep' : ''}"><path d="${area}" clip-path="url(#below-a)" fill="#b86243" opacity=".23"/><path d="${area}" clip-path="url(#above-a)" fill="#5e9a7c" opacity=".23"/>
        <path d="${pathOf(lineB)}" class="reference-line"/><path d="${pathOf(lineA)}" class="current-line"/></g>
        <path d="M${x(d - 1)} 7V177" class="guide-line"/>
        ${[[a, '#b86243'], [b, '#5e9a7c']].map(([values, color]) => values[d - 1] === undefined ? '' : `<circle class="chart-marker" cx="${x(d - 1)}" cy="${y(values[d - 1])}" r="3.5" fill="${color}" stroke="#fffdf8"/>`).join('')}
      </svg>
      <div class="compare-hits" aria-hidden="true">${Array.from({ length: 31 }, (_, i) => `<button tabindex="-1" ${action('pick-compare', i + 1)} title="Día ${i + 1}"></button>`).join('')}</div>
      <div class="line-days" aria-hidden="true">${[1,5,10,15,20,25,31].map(n => `<span style="left:${(n - 1) / 30 * 100}%">${String(n).padStart(2, '0')}</span>`).join('')}</div>
      </div></div>
    <div class="compare-detail"><div class="detail-head"><div><p class="eyebrow">DIFERENCIA / DÍA ${d}</p><h3>${diff ? signed(diff.delta) : 'Sin día equivalente'}</h3></div>${daySelector}</div>
    ${diff ? `<p>${monthName(state.month)}: <strong>${money(diff.left)}</strong> · ${monthName(reference)}: <strong>${money(diff.right)}</strong></p>
    ${diff.diffs.length ? `<div class="category-grid">${diff.diffs.map(({ category, delta }) => `<div class="category-tile" style="--tint:${categories[category].color}"><i></i><span>${categories[category].label}</span><strong>${signed(delta)}</strong></div>`).join('')}</div>` : '<p class="empty">Sin diferencias.</p>'}` : '<p>Uno de los meses no tiene ese día.</p>'}
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
  return `<section class="panel block flow-panel"><div class="panel-head"><h2>Sigue el dinero</h2>${select('Mes del flujo', 'month', monthItems(), state.month)}</div>
    <div class="flow-captions"><span>Cuentas</span><span>Categorías</span></div>
    <div class="flow-figure">
      <div class="flow-nodes from">${sources.map(a => `<div style="${nodeStyle(sources.map(s => s.id), 'account', a.id, a.color)}"><span>${escapeText(a.short)}</span><i></i></div>`).join('')}</div>
      <svg viewBox="0 0 500 272" preserveAspectRatio="none" aria-label="Rutas de gastos de izquierda a derecha">
        ${[100,200,300,400].map(x => `<path class="svg-grid" d="M${x} 0V272"/>`).join('')}
        <g class="${reveal ? 'chart-sweep' : ''}">${all.map(r => {
          const sy = distribute(sources.map(a => a.id), r.account, 'account')[r.id], ty = distribute(sinks, r.category, 'category')[r.id];
          const d = `M0 ${sy} C180 ${sy},320 ${ty},500 ${ty}`, color = categories[r.category].color;
          const selected = active?.id === r.id;
          return `<g class="flow-route ${active && !selected ? 'dim' : ''} ${selected ? 'lit' : ''}" ${action('route', r.id)}><title>${escapeText(account(r.account).label)} → ${categories[r.category].label}: ${money(r.cents)}</title>
            <path d="${d}" fill="none" stroke="${color}" stroke-width="${measure(r.cents)}"/><path class="flow-hit" d="${d}" fill="none" stroke="transparent" stroke-width="${Math.max(12, measure(r.cents))}"/>
            ${reduced.matches ? '' : `<circle r="2.7" fill="#fffdf8" aria-hidden="true"><animateMotion dur="${2.6 + ty / 165}s" begin="-${sy / 110}s" repeatCount="indefinite" path="${d}"/></circle>`}</g>`;
        }).join('')}</g>
      </svg>
      <div class="flow-nodes to">${sinks.map(c => `<div style="${nodeStyle(sinks, 'category', c, categories[c].color)}"><i></i><span>${categories[c].label}</span></div>`).join('')}</div>
    </div>
    <div class="flow-controls">${select('Ruta de dinero', 'flow-select', [['', 'Todas las rutas'], ...all.map(r => [r.id, account(r.account).short + ' → ' + categories[r.category].label])], active?.id ?? '')}<span>${money(grand)}</span></div>
    <div id="flow-detail">${flowDetail(active)}</div>
  </section>`;
}

function flowDetail(route) {
  if (!route) return '';
  return `<div class="unfold"><div class="detail-head"><div><p class="eyebrow">${escapeText(account(route.account).label)} → ${categories[route.category].label}</p><h3>${money(route.cents)}</h3></div></div>${movementList(route.items)}</div>`;
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
  if (!report) return '<p class="empty">Aún no hay historial para hacer un pronóstico.</p>';

  const { date, series, opening, closing, net, income, expense, history, shortfall } = report;
  const period = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  const periodName = period.charAt(0).toUpperCase() + period.slice(1);
  const days = series.length - 1;
  const amounts = series.map(point => point.balance);
  const low = Math.min(...amounts), high = Math.max(...amounts);
  const step = axisStep((high - low) / 400) * 100;
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

  return `<div class="forecast-main"><section class="panel block">
    <div class="panel-head"><h2>Pronóstico</h2><span class="forecast-period">${periodName}</span></div>
    <p class="account-overview">Saldo estimado <strong>${signed(closing).replace(/^\+/, '')}</strong><small class="${negative(net)}">${signed(net)} vs. saldo actual</small></p>
    </section><section class="forecast-metrics" aria-label="Ingresos y gastos estimados">
        ${metric('Ingresos', money(income), 'arrowDown', 'honey')}
        ${metric('Gastos', money(expense), 'arrowUp', 'coral')}
      </section>
      <section class="panel block forecast-panel" aria-labelledby="forecast-title">
        <div class="panel-head"><h2 id="forecast-title">Saldo diario</h2><span class="plot-unit">S/</span></div>
        <div class="compare-key"><span><i></i>Estimado</span><span class="reference"><i></i>Saldo actual · ${money(opening)}</span></div>
        <div class="line-figure forecast-figure"><div class="y-labels" aria-hidden="true">${ticks.map(tick => `<span style="top:${y(tick) / 180 * 100}%">${tick < 0 ? '−' : ''}${num(Math.abs(tick) / 100)}</span>`).join('')}</div>
          <div class="line-plot">
            <svg viewBox="-3 0 606 180" preserveAspectRatio="none" role="img" aria-label="Saldo estimado desde ${money(opening)} hasta ${signed(closing).replace(/^\+/, '')} el día ${days}">
              <defs><linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-opacity=".27"/><stop offset="1" stop-opacity="0"/></linearGradient></defs>
              ${ticks.map(tick => `<path class="svg-grid" d="M0 ${y(tick)}H600"/>`).join('')}
              <path class="reference-line" d="M0 ${y(opening)}H600"/>
              <g class="chart-sweep"><path class="forecast-area" d="${area}"/><path class="current-line" id="forecast-line" d="${line}"/><circle cx="600" cy="${y(closing)}" r="4" class="forecast-point"/></g>
            </svg>
            <div class="line-days" aria-hidden="true">${[0, 5, 10, 15, 20, 25, days].map(day => `<span style="left:${day / days * 100}%">${day || 'Inicio'}</span>`).join('')}</div>
          </div>
        </div>
        ${shortfall ? `<p class="negative">Primer saldo estimado bajo cero el día ${shortfall.day} · ${signed(shortfall.balance)}</p>` : ''}
        <details class="forecast-method"><summary>Cálculo ${icon('chevronDown', 15)}</summary><p class="forecast-note">${note}</p></details>
      </section></div>`;
}

function filteredActivity() {
  const q = state.filter.search.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return monthMovements(state.month).filter(m =>
    (!state.filter.account || state.filter.account === m.account || state.filter.account === m.to)
    && (!state.filter.kind || state.filter.kind === m.kind)
    && (!state.filter.category || state.filter.category === m.category)
    && (!state.filter.date || state.filter.date === `${m.month}-${String(m.day).padStart(2, '0')}`)
    && (!q || `${m.label} ${categories[m.category].label}`.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q))
  ).sort((a, b) => b.day - a.day);
}
function activityResults() {
  const list = filteredActivity();
  return `<p class="sr-only" role="status">${list.length} ${list.length === 1 ? 'movimiento' : 'movimientos'}</p>${movementList(list)}`;
}
function activity() {
  return `<section class="panel block activity-panel"><div class="panel-head"><h2>Historial</h2>${select('Mes de actividad', 'month', monthItems(), state.month)}</div>
    <label class="search-wrap">${icon('search', 17)}<span class="sr-only">Buscar movimientos</span><input type="search" id="activity-search" placeholder="Buscar"></label>
    <details class="activity-filters" ${state.filter.account || state.filter.kind || state.filter.category || state.filter.date ? 'open' : ''}><summary>Filtros ${icon('chevronDown', 14)}</summary><div class="filter-row">
    ${select('Filtrar por cuenta', 'filter-account', [['', 'Todas las cuentas'], ...accounts.map(a => [a.id, a.label])], state.filter.account)}
    ${select('Filtrar por tipo', 'filter-kind', [['', 'Todos los tipos'], ...Object.entries(kindName)], state.filter.kind)}
    ${select('Filtrar por motivo', 'filter-category', [['', 'Todos los motivos'], ...Object.entries(categories).map(([id, value]) => [id, value.label])], state.filter.category)}
    ${select('Filtrar por fecha', 'filter-date', [['', 'Cualquier día'], ...Array.from({ length: months[state.month].days }, (_, i) => [state.month + '-' + String(i + 1).padStart(2, '0'), dateText(state.month, i + 1)])], state.filter.date)}
    </div></details>
    <div id="activity-results">${activityResults()}</div></section>`;
}

function organize() {
  return heading('Organízate') + modules.organizeTabs() + `<div class="organize-actions"><button class="primary-button" ${action('form', 'movement')}>${icon('plus', 17)} Movimiento</button></div>`
    + ({ cuentas: accountsView, historial: activity, calendario: modules.calendarView }[state.organize])()
    + `<button class="scan-fab" aria-label="Escanear boleta" title="Escanear boleta" ${action('form', 'receipt')}>${icon('scan', 24)}</button>`;
}

const views = { inicio: home, organiza: organize, explorar: explore, metas: modules.goalsView, asistente: modules.assistantView };
let pageTransition;
function refreshAroundSelect(current, next, picker) {
  const index = [...current.children].findIndex(child => child.contains(picker));
  const branch = current.children[index];
  const nextBranch = next.children[index];
  if (branch === picker) {
    const value = nextBranch.value;
    if (picker.options.length !== nextBranch.options.length ||
        [...picker.options].some((item, i) => item.value !== nextBranch.options[i].value || item.text !== nextBranch.options[i].text)) {
      picker.replaceChildren(...nextBranch.options);
    }
    picker.value = value;
  } else {
    refreshAroundSelect(branch, nextBranch, picker);
  }
  while (branch.previousSibling) branch.previousSibling.remove();
  while (branch.nextSibling) branch.nextSibling.remove();
  const siblings = [...next.childNodes];
  const position = siblings.indexOf(nextBranch);
  branch.before(...siblings.slice(0, position));
  branch.after(...siblings.slice(position + 1));
}

function render({ focus, direction = 0, centerDay = false, picker } = {}) {
  const previousChart = main.querySelector('.bar-scroll');
  const chartPosition = previousChart && { key: previousChart.dataset.chartKey, left: previousChart.scrollLeft };
  const report = main.querySelector('.financial-report');
  if (report) state.reportOpen = report.open;
  const inCharts = state.section === 'explorar' && state.explore === 'datos';
  if (!inCharts || state.tab !== 'compare') lastCompareKey = '';
  if (state.section !== 'inicio' && (!inCharts || state.tab !== 'days')) lastBarsKey = '';
  if (!inCharts || state.tab !== 'flow') lastFlowMonth = '';
  main.classList.toggle('scene-enter', lastScene !== state.section);
  lastScene = state.section;
  pageTransition?.cancel();
  const html = views[state.section]();
  if (picker) {
    const next = document.createElement('div');
    next.innerHTML = html;
    // Keep the native picker mounted while its platform menu commits the choice.
    refreshAroundSelect(main, next, picker);
  } else {
    main.innerHTML = html;
  }
  const chart = main.querySelector('.bar-scroll');
  if (chart && chart.scrollWidth > chart.clientWidth) {
    if (!centerDay && chartPosition?.key === chart.dataset.chartKey) {
      chart.scrollLeft = chartPosition.left;
    } else {
      const cell = chart.querySelector('.bar-cell.highlighted');
      if (cell) chart.scrollLeft = cell.offsetLeft + (cell.offsetWidth - chart.clientWidth) / 2;
    }
  }
  if (inHistory()) main.querySelector('#activity-search').value = state.filter.search;
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
    <h2 id="movement-title">${escapeText(m.label)}</h2><strong class="dialog-amount ${m.kind === 'income' ? 'positive' : ''}">${amount(m)}</strong>
    <dl><div><dt>Fecha</dt><dd>${dateText(m.month, m.day)} de ${m.month.slice(0, 4)}</dd></div><div><dt>Cuenta de origen</dt><dd>${escapeText(account(m.account).label)}</dd></div>
    ${m.to ? `<div><dt>Cuenta de destino</dt><dd>${escapeText(account(m.to).label)}</dd></div>` : ''}
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
    case 'compare-day': state.explore = 'datos'; state.tab = 'compare'; state.day = Math.min(state.day, months[state.month].days); navigate('explorar'); if (key) main.focus(); return;
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
    case 'account':
      state.filter = { account: value, kind: '', search: '', category: '', date: '' };
      state.month = newestMonth(); state.organize = 'historial';
      render();
      if (key) main.focus();
      return;
    case 'movement': movementDialog(movements.find(m => m.id === value)); return;
    case 'pick-compare': state.day = Number(value); break;
    case 'route': selectFlowRoute(state.selectedRoute === value ? null : value); return;
    default: modules.handleAction(id, value, focus); return;
  }
  render({ focus });
});

main.addEventListener('change', e => {
  if (!(e.target instanceof HTMLSelectElement)) return;
  const { value, dataset: { change: id } } = e.target;
  switch (id) {
    case 'month':
      state.month = value;
      state.filter.date = '';
      state.day = Math.min(state.day, months[value].days);
      state.opened = false; state.category = null; state.selectedRoute = null; state.spendingCategory = null;
      break;
    case 'chart-day':
      if (value) state.day = Number(value);
      if (state.section === 'inicio') state.kind = 'expense';
      state.opened = Boolean(value); state.category = null;
      render({ picker: e.target, centerDay: true });
      if (value) requestAnimationFrame(() => scrollDetail('day-detail', false));
      return;
    case 'kind': state.kind = value; state.opened = false; state.category = null; break;
    case 'compare-day-select': state.day = Number(value); break;
    case 'compare-month': state.compareMonth = value; break;
    case 'flow-select': selectFlowRoute(value); return;
    case 'filter-kind': state.filter.kind = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    case 'filter-account': state.filter.account = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    case 'filter-category': state.filter.category = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    case 'filter-date': state.filter.date = value; document.querySelector('#activity-results').innerHTML = activityResults(); return;
    default: return;
  }
  render({ picker: e.target });
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
    const reference = state.compareMonth && state.compareMonth !== state.month ? state.compareMonth : otherMonth(state.month);
    state.compareMonth = state.month;
    state.month = reference;
    state.spendingCategory = null;
    render();
  } else {
    for (const el of main.querySelectorAll('[data-month-target]')) el.classList.remove('drop-ready');
  }
});
reduced.addEventListener('change', () => {
  if (state.section === 'explorar' && state.explore === 'datos' && state.tab === 'flow') render();
});
window.addEventListener('storage', event => {
  if (!syncPersonal(event)) return;
  if (!months[state.month]) state.month = newestMonth();
  if (!months[state.compareMonth]) state.compareMonth = null;
  render();
});
render();
