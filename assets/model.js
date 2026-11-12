export const accounts = [
  { id: 'principal', label: 'Cuenta principal', short: 'Principal', icon: 'wallet', opening: 2900, color: '#a78bfa', suffix: '4821' },
  { id: 'ahorros', label: 'Ahorros', short: 'Ahorros', icon: 'vault', opening: 4350, color: '#41e6ce', suffix: '0624' },
  { id: 'digital', label: 'Billetera digital', short: 'Digital', icon: 'card', opening: 1900, color: '#7eb1ff', suffix: '2190' },
];

export const categories = {
  hogar: { label: 'Hogar', color: '#a78bfa', icon: 'home' },
  comida: { label: 'Comida', color: '#41e6ce', icon: 'food' },
  transporte: { label: 'Transporte', color: '#7eb1ff', icon: 'compass' },
  ocio: { label: 'Ocio', color: '#f1a7f6', icon: 'spark' },
  servicios: { label: 'Servicios', color: '#f7c378', icon: 'bolt' },
  ingreso: { label: 'Ingresos', color: '#41e6ce', icon: 'arrowDown' },
  transferencia: { label: 'Entre tus cuentas', color: '#a78bfa', icon: 'transfer' },
};
export const expenses = Object.keys(categories).slice(0, 5);
export const months = {
  '2026-09': { label: 'Septiembre', short: 'sep', days: 30 },
  '2026-10': { label: 'Octubre', short: 'oct', days: 31 },
};
export const latest = '2026-10';
export const previous = '2026-09';
const records = {
  '2026-09': [
    [1, 'principal', 'ingreso', 3900, 'Sueldo · Estudio Boreal'], [1, 'digital', 'comida', 62, 'Mercado del barrio'],
    [2, 'principal', 'servicios', 105, 'Internet de casa'], [4, 'digital', 'comida', 112, 'Supermercado'],
    [5, 'principal', 'transporte', 58, 'Recarga de movilidad'], [6, 'principal', 'transferencia', 450, 'Ahorro mensual', 'ahorros'],
    [7, 'principal', 'ocio', 145, 'Entradas al teatro'], [8, 'digital', 'comida', 76, 'Almuerzo con amigos'],
    [10, 'principal', 'hogar', 225, 'Sillas para el comedor'], [11, 'digital', 'transporte', 41, 'Taxi'],
    [12, 'principal', 'comida', 121, 'Compras de la semana'], [14, 'principal', 'servicios', 188, 'Agua y luz'],
    [15, 'principal', 'hogar', 430, 'Adelanto de alquiler'], [15, 'digital', 'comida', 99, 'Mercado del barrio'],
    [16, 'principal', 'ocio', 58, 'Librería'], [18, 'principal', 'ingreso', 750, 'Proyecto · Atlas'],
    [19, 'digital', 'transporte', 56, 'Movilidad'], [20, 'principal', 'hogar', 630, 'Saldo del alquiler'],
    [21, 'principal', 'transferencia', 300, 'Recarga de billetera', 'digital'], [22, 'digital', 'comida', 165, 'Supermercado'],
    [24, 'principal', 'servicios', 112, 'Plan móvil'], [25, 'digital', 'ocio', 138, 'Concierto'],
    [27, 'principal', 'comida', 224, 'Cena de cumpleaños'], [28, 'principal', 'transporte', 82, 'Combustible'],
    [29, 'ahorros', 'ingreso', 12.5, 'Intereses de ahorros'], [30, 'digital', 'comida', 42, 'Café y pan'],
  ],
  '2026-10': [
    [1, 'principal', 'ingreso', 4200, 'Sueldo · Estudio Boreal'], [1, 'digital', 'comida', 108, 'Mercado del barrio'],
    [2, 'principal', 'servicios', 124, 'Internet de casa'], [3, 'digital', 'transporte', 48, 'Recarga de movilidad'],
    [4, 'principal', 'comida', 257.9, 'Supermercado'], [5, 'principal', 'ocio', 97, 'Festival de cine'],
    [6, 'principal', 'transferencia', 600, 'Ahorro mensual', 'ahorros'], [6, 'digital', 'comida', 72, 'Café y pan'],
    [7, 'principal', 'hogar', 210, 'Reparación de cocina'], [8, 'digital', 'transporte', 76, 'Movilidad'],
    [9, 'digital', 'comida', 132, 'Almuerzo con amigos'], [10, 'principal', 'servicios', 235, 'Agua y luz'],
    [11, 'principal', 'ocio', 68, 'Librería'], [12, 'principal', 'comida', 302, 'Compras de la semana'],
    [13, 'digital', 'comida', 124, 'Mercado del barrio'], [14, 'principal', 'transporte', 49, 'Taxi'],
    [15, 'principal', 'hogar', 1150, 'Alquiler · Miraflores'], [15, 'principal', 'hogar', 120, 'Mantenimiento del edificio'],
    [15, 'digital', 'comida', 135, 'Supermercado del barrio'], [15, 'digital', 'transporte', 75, 'Recarga de movilidad'],
    [16, 'digital', 'comida', 51, 'Almuerzo'], [17, 'principal', 'ocio', 192, 'Concierto'],
    [18, 'principal', 'ingreso', 1480, 'Proyecto · Atlas'], [18, 'principal', 'transporte', 98, 'Combustible'],
    [19, 'principal', 'hogar', 332, 'Escritorio'], [20, 'digital', 'comida', 74, 'Mercado del barrio'],
    [21, 'principal', 'transferencia', 400, 'Recarga de billetera', 'digital'], [21, 'digital', 'transporte', 105, 'Movilidad'],
    [22, 'principal', 'servicios', 164, 'Plan móvil y nube'], [23, 'digital', 'comida', 223, 'Cena de cumpleaños'],
    [24, 'digital', 'ocio', 109, 'Entradas al teatro'], [25, 'principal', 'hogar', 410, 'Muebles para casa'],
    [26, 'digital', 'comida', 59, 'Café y pan'], [27, 'principal', 'comida', 269, 'Supermercado'],
    [28, 'digital', 'transporte', 73, 'Taxi'], [29, 'ahorros', 'ingreso', 18.75, 'Intereses de ahorros'],
    [29, 'digital', 'comida', 115, 'Almuerzo con amigos'], [30, 'principal', 'ocio', 171, 'Salida de fin de mes'],
    [31, 'digital', 'comida', 89, 'Mercado del barrio'],
  ],
};

// All arithmetic stays in integer céntimos; only the presentation formats soles.
export const movements = Object.entries(records).flatMap(([month, list]) => list.map(
  ([day, account, category, amount, label, to], i) => ({
    id: month + '-' + (i + 1), month, day, account, category, cents: Math.round(amount * 100), label, to,
    kind: category === 'ingreso' ? 'income' : category === 'transferencia' ? 'transfer' : 'expense',
  }),
));
export const money = cents => 'S/ ' + new Intl.NumberFormat('en-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(cents) / 100);
export const signed = cents => (cents < 0 ? '−' : cents > 0 ? '+' : '') + money(cents);
export const sum = list => list.reduce((n, item) => n + item.cents, 0);
export const monthMovements = month => movements.filter(m => m.month === month);
export const byDay = (month, day, kind = 'expense') => movements.filter(m => m.month === month && m.day === day && m.kind === kind);
export const totals = month => Object.fromEntries(['income', 'expense', 'transfer'].map(kind => [kind, sum(monthMovements(month).filter(m => m.kind === kind))]));
export function balances(through = latest) {
  const result = Object.fromEntries(accounts.map(a => [a.id, a.opening * 100]));
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
  const amountsByDay = daily(month);
  const peak = Math.max(...amountsByDay);
  const earlier = Object.keys(months).filter(key => key < month).sort().at(-1);
  return {
    ...figures, net, opening: closing - net, closing, accountBalances: balances(month),
    entries: entries.length, byCategory, largestExpense: [...outflows].sort((a, b) => b.cents - a.cents)[0],
    peak, peakDay: amountsByDay.indexOf(peak) + 1, earlier, prior: earlier ? totals(earlier) : null,
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

// Noviembre: flujo previsto de la cuenta de pagos. No altera el historial.
export const forecastStart = 81000;
export const events = [
  { id: 'cobro', label: 'Cobro · Proyecto Atlas', day: 4, cents: 160000 },
  { id: 'alquiler', label: 'Pago · Alquiler', day: 6, cents: -115000 },
  { id: 'servicios', label: 'Pago · Servicios', day: 9, cents: -26500 },
  { id: 'mercado', label: 'Pago · Supermercado', day: 13, cents: -31000 },
  { id: 'sueldo', label: 'Cobro · Estudio Boreal', day: 19, cents: 220000 },
  { id: 'cuota', label: 'Pago · Cuota del equipo', day: 24, cents: -48500 },
];
export const defaultDates = () => Object.fromEntries(events.map(e => [e.id, e.day]));
export function project(dates = defaultDates()) {
  let balance = forecastStart;
  return Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    balance += events.filter(e => dates[e.id] === day).reduce((n, e) => n + e.cents, 0);
    return { day, balance };
  });
}
