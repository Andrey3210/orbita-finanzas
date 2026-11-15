export const accounts = [
  { id: 'principal', label: 'Cuenta principal', short: 'Principal', icon: 'wallet', opening: 130, color: '#b86243', suffix: '4821' },
  { id: 'ahorros', label: 'Ahorros', short: 'Ahorros', icon: 'vault', opening: 165, color: '#5e9a7c', suffix: '0624' },
  { id: 'digital', label: 'Billetera digital', short: 'Digital', icon: 'card', opening: 165, color: '#ca963e', suffix: '2190' },
];

export const categories = {
  hogar: { label: 'Hogar', color: '#b86243', icon: 'home' },
  comida: { label: 'Comida', color: '#5e9a7c', icon: 'food' },
  transporte: { label: 'Transporte', color: '#ca963e', icon: 'compass' },
  ocio: { label: 'Ocio', color: '#a77f8f', icon: 'spark' },
  servicios: { label: 'Servicios', color: '#67888a', icon: 'bolt' },
  estudios: { label: 'Estudios', color: '#8173a4', icon: 'layers' },
  ingreso: { label: 'Ingresos', color: '#b86243', icon: 'arrowDown' },
  transferencia: { label: 'Entre tus cuentas', color: '#b86243', icon: 'transfer' },
};
export const expenses = Object.keys(categories).filter(id => id !== 'ingreso' && id !== 'transferencia');
export const months = {
  '2026-09': { label: 'Septiembre', short: 'sep', days: 30 },
  '2026-10': { label: 'Octubre', short: 'oct', days: 31 },
};
export const latest = '2026-10';
export const previous = '2026-09';
export function period(key) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  const name = new Intl.DateTimeFormat('es-PE', { month: 'long', timeZone: 'UTC' }).format(date);
  return { label: name[0].toUpperCase() + name.slice(1), short: name.slice(0, 3), days: new Date(Date.UTC(year, month, 0)).getUTCDate() };
}

export function shiftMonth(key, offset) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}
const records = {
  '2026-09': [
    [1, 'principal', 'ingreso', 430, 'Trabajo de medio tiempo'], [1, 'digital', 'comida', 12, 'Menú universitario'],
    [2, 'principal', 'servicios', 35, 'Parte del internet de casa'], [4, 'digital', 'comida', 19.5, 'Comida para la semana'],
    [5, 'digital', 'transporte', 20, 'Recarga del Metropolitano'], [6, 'principal', 'transferencia', 25, 'Ahorro mensual', 'ahorros'],
    [7, 'digital', 'ocio', 15, 'Cine con descuento'], [8, 'digital', 'comida', 12, 'Menú cerca de la universidad'],
    [10, 'principal', 'estudios', 32, 'Cuadernos y separatas'], [11, 'digital', 'transporte', 8, 'Pasajes a clases'],
    [12, 'principal', 'comida', 24, 'Compras para llevar almuerzo'], [14, 'principal', 'servicios', 20, 'Recarga del celular'],
    [15, 'principal', 'estudios', 52, 'Materiales de laboratorio'], [15, 'digital', 'comida', 10, 'Menú universitario'],
    [16, 'principal', 'ocio', 16, 'Salida con compañeros'], [18, 'principal', 'ingreso', 200, 'Apoyo familiar'],
    [19, 'digital', 'transporte', 10, 'Pasajes a clases'], [20, 'principal', 'hogar', 135, 'Aporte en casa'],
    [21, 'principal', 'transferencia', 95, 'Recarga de billetera', 'digital'], [22, 'digital', 'comida', 42, 'Mercado del barrio'],
    [24, 'principal', 'estudios', 21, 'Copias y anillado'], [25, 'digital', 'ocio', 17, 'Feria universitaria'],
    [27, 'principal', 'comida', 28, 'Compras de la semana'], [28, 'digital', 'transporte', 13, 'Pasajes a clases'],
    [29, 'ahorros', 'ingreso', 0.4, 'Intereses de ahorros'], [30, 'digital', 'comida', 8.5, 'Desayuno antes de clases'],
  ],
  '2026-10': [
    [1, 'principal', 'ingreso', 460, 'Trabajo de medio tiempo'], [1, 'digital', 'comida', 13.5, 'Menú universitario'],
    [2, 'principal', 'servicios', 35, 'Parte del internet de casa'], [3, 'digital', 'transporte', 20, 'Recarga del Metropolitano'],
    [4, 'principal', 'comida', 32.8, 'Mercado del barrio'], [5, 'principal', 'ocio', 18, 'Cine con descuento'],
    [6, 'principal', 'transferencia', 30, 'Ahorro mensual', 'ahorros'], [6, 'digital', 'comida', 8.5, 'Desayuno antes de clases'],
    [7, 'principal', 'hogar', 28, 'Productos de limpieza'], [8, 'digital', 'transporte', 9, 'Pasajes a clases'],
    [9, 'digital', 'comida', 13, 'Menú cerca de la universidad'], [10, 'principal', 'servicios', 24, 'Recarga del celular'],
    [10, 'principal', 'transferencia', 95, 'Recarga de billetera', 'digital'],
    [11, 'principal', 'estudios', 15, 'Impresiones y copias'], [12, 'principal', 'comida', 31.5, 'Compras para llevar almuerzo'],
    [13, 'digital', 'comida', 10, 'Menú universitario'], [14, 'digital', 'transporte', 6, 'Pasajes a clases'],
    [15, 'principal', 'estudios', 145, 'Materiales del proyecto de ciclo'], [15, 'principal', 'estudios', 18, 'Impresión del proyecto'],
    [15, 'principal', 'comida', 12, 'Menú universitario'], [15, 'principal', 'transporte', 6, 'Pasajes a clases'],
    [16, 'digital', 'comida', 9, 'Desayuno antes de clases'], [17, 'principal', 'ocio', 16, 'Salida con compañeros'],
    [18, 'principal', 'ingreso', 200, 'Apoyo familiar'], [18, 'principal', 'transporte', 11, 'Pasajes a la biblioteca'],
    [19, 'principal', 'estudios', 26, 'Separatas del ciclo'], [20, 'principal', 'comida', 12, 'Menú universitario'],
    [21, 'digital', 'transporte', 17, 'Recarga del Metropolitano'],
    [22, 'principal', 'servicios', 10, 'Datos para clases'], [23, 'principal', 'comida', 29, 'Compras de la semana'],
    [24, 'digital', 'ocio', 16, 'Feria universitaria'], [25, 'principal', 'hogar', 140, 'Aporte en casa'],
    [26, 'digital', 'comida', 8.5, 'Desayuno antes de clases'], [27, 'principal', 'comida', 26, 'Mercado del barrio'],
    [28, 'digital', 'transporte', 9.5, 'Pasajes a clases'], [29, 'ahorros', 'ingreso', 0.5, 'Intereses de ahorros'],
    [29, 'digital', 'comida', 12.5, 'Menú cerca de la universidad'], [30, 'principal', 'ocio', 12, 'Salida con compañeros'],
    [31, 'digital', 'comida', 7.5, 'Desayuno antes de clases'],
  ],
};

// All arithmetic stays in integer céntimos; only the presentation formats soles.
export const movements = Object.entries(records).flatMap(([month, list]) => list.map(
  ([day, account, category, amount, label, to], i) => ({
    id: month + '-' + (i + 1), month, day, account, category, cents: Math.round(amount * 100), label, to,
    kind: category === 'ingreso' ? 'income' : category === 'transferencia' ? 'transfer' : 'expense',
  }),
));

const initialAccounts = accounts.slice();
const initialMovements = movements.slice();
export function loadLedger(data) {
  const entries = [...initialAccounts, ...data.accounts].map(account => {
    const label = data.accountNames?.[account.id];
    return label ? { ...account, label, short: label } : account;
  });
  accounts.splice(0, accounts.length, ...entries);
  movements.splice(0, movements.length, ...initialMovements, ...data.movements);
  for (const key of Object.keys(months)) if (key !== latest && key !== previous) delete months[key];
  for (const { month } of movements) months[month] ??= period(month);
  for (const { created } of accounts) if (created) months[created] ??= period(created);
}

export const newestMonth = () => Object.keys(months).sort().at(-1);
export const money = cents => 'S/ ' + new Intl.NumberFormat('en-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(cents) / 100);
export const signed = cents => (cents < 0 ? '−' : cents > 0 ? '+' : '') + money(cents);
export const sum = list => list.reduce((n, item) => n + item.cents, 0);
export const monthMovements = month => movements.filter(m => m.month === month);
export const byDay = (month, day, kind = 'expense') => movements.filter(m => m.month === month && m.day === day && m.kind === kind);
export const totals = month => Object.fromEntries(['income', 'expense', 'transfer'].map(kind => [kind, sum(monthMovements(month).filter(m => m.kind === kind))]));
export function balances(through = newestMonth()) {
  const result = Object.fromEntries(accounts.map(a => [a.id, a.created && a.created > through ? 0 : (a.openingCents ?? a.opening * 100)]));
  for (const m of movements.filter(m => m.month <= through)) {
    result[m.account] += m.kind === 'income' ? m.cents : -m.cents;
    if (m.kind === 'transfer') result[m.to] += m.cents;
  }
  return result;
}
export const portfolio = month => Object.values(balances(month)).reduce((a, b) => a + b, 0);
export const daily = (month, kind = 'expense') => Array.from({ length: months[month].days }, (_, i) => sum(byDay(month, i + 1, kind)));
export function groups(list) {
  return [...new Set(list.map(m => m.category))].map(category => {
    const items = list.filter(m => m.category === category);
    return { category, items, cents: sum(items) };
  }).sort((a, b) => b.cents - a.cents);
}
export function monthlyReport(month) {
  const entries = monthMovements(month);
  const figures = totals(month);
  const net = figures.income - figures.expense;
  const closing = portfolio(month);
  const outflows = entries.filter(m => m.kind === 'expense');
  const byCategory = groups(outflows);
  const earlier = shiftMonth(month, -1);
  return {
    ...figures, net, opening: closing - net, closing, accountBalances: balances(month),
    entries: entries.length, byCategory,
    earlier: months[earlier] ? earlier : null, prior: months[earlier] ? totals(earlier) : null,
  };
}
export function compareDay(a, b, day, kind = 'expense') {
  if (day > months[a].days || day > months[b].days) return null;
  const left = byDay(a, day, kind);
  const right = byDay(b, day, kind);
  const diffs = [...new Set([...left, ...right].map(m => m.category))].map(category => ({
    category, delta: sum(left.filter(m => m.category === category)) - sum(right.filter(m => m.category === category)),
  })).filter(x => x.delta !== 0).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  return { left: sum(left), right: sum(right), delta: sum(left) - sum(right), diffs };
}
export function routes(month) {
  return accounts.flatMap(a => groups(monthMovements(month).filter(m => m.kind === 'expense' && m.account === a.id))
    .map(g => ({ ...g, account: a.id, id: a.id + '-' + g.category })));
}

export function predictNextMonth(through = newestMonth()) {
  const history = Object.keys(months).filter(month => month <= through).sort().slice(-2);
  if (!history.length) return null;
  const lastMonth = history.at(-1);
  const [year, month] = lastMonth.split('-').map(Number);
  const date = new Date(Date.UTC(year, month, 1));
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const opening = portfolio(lastMonth);
  const schedule = Array.from({ length: days }, () => ({ income: 0, expense: 0 }));
  const totalWeight = history.length + 1;

  for (const key of history) {
    const weight = key === lastMonth ? 2 : 1;
    for (const movement of monthMovements(key)) {
      if (movement.kind === 'transfer') continue;
      const index = Math.min(movement.day, days) - 1;
      schedule[index][movement.kind] += movement.cents * weight;
    }
  }

  // Round accumulated totals so the last point agrees with the monthly amounts.
  let weightedIncome = 0, weightedExpense = 0;
  const series = [{ day: 0, balance: opening }];
  schedule.forEach(({ income, expense }, index) => {
    weightedIncome += income;
    weightedExpense += expense;
    series.push({
      day: index + 1,
      balance: opening + Math.round(weightedIncome / totalWeight) - Math.round(weightedExpense / totalWeight),
    });
  });
  const closing = series.at(-1).balance;
  return {
    date, history, opening, closing, net: closing - opening, series,
    income: Math.round(weightedIncome / totalWeight), expense: Math.round(weightedExpense / totalWeight),
    shortfall: series.find(point => point.balance < 0),
  };
}
