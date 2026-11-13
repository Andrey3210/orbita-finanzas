import { accounts, balances, categories, loadLedger, newestMonth } from './model.js?v=miluka-1';

const key = 'miluka.finanzas.v1';
export function localDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function dueIn(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}

const initial = {
  accounts: [], movements: [],
  payments: [
    { id: 'internet', label: 'Internet', date: dueIn(2), cents: 12400, paid: false },
    { id: 'movil', label: 'Plan móvil', date: dueIn(8), cents: 6400, paid: false },
  ],
  goals: [
    { id: 'laptop', label: 'Mi próxima laptop', target: 220000, saved: 54000, reserved: false, account: 'ahorros', date: '' },
  ],
  learning: { completed: [], level: '', coins: 0, badges: [] },
};

function read() {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? structuredClone(initial);
  } catch {
    return structuredClone(initial);
  }
}

export let personal = read();
loadLedger(personal);

export function syncPersonal(event) {
  if (event.key !== key && event.key !== null) return false;
  personal = read();
  loadLedger(personal);
  return true;
}

export function updatePersonal(change) {
  const next = read();
  loadLedger(next);
  try {
    change(next);
    localStorage.setItem(key, JSON.stringify(next));
  } catch (error) {
    loadLedger(personal);
    throw error;
  }
  personal = next;
  loadLedger(personal);
}

export function asCents(value, allowZero = false) {
  const normalized = String(value ?? '').trim().replace(',', '.');
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(normalized);
  const cents = match && (Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')));
  if (cents === null || (!allowZero && cents === 0)) throw new Error('Ingresa un importe válido en soles, con hasta dos decimales.');
  return cents;
}

export function nameFrom(value) {
  const label = String(value ?? '').trim();
  if (!label || label.length > 72) throw new Error('Escribe un nombre de hasta 72 caracteres.');
  return label;
}

export function requiredDate(value) {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(value) || new Date(value + 'T00:00:00Z').toJSON()?.slice(0, 10) !== value) {
    throw new Error('Elige una fecha válida.');
  }
  return value;
}

export function reserved(account, data = personal) {
  return data.goals.filter(goal => goal.reserved && (!account || goal.account === account)).reduce((total, goal) => total + goal.saved, 0);
}

export function saveAccount(data, values, id) {
  const label = nameFrom(values.name);
  if (accounts.some(account => account.id !== id && account.label.toLowerCase() === label.toLowerCase())) throw new Error('Ya tienes una cuenta con ese nombre.');
  if (id) {
    data.accountNames ??= {};
    data.accountNames[id] = label;
    return;
  }
  data.accounts.push({
    id: crypto.randomUUID(), label, short: label, icon: 'wallet', color: '#77a88c',
    openingCents: asCents(values.cents || '0', true), created: localDate().slice(0, 7),
  });
}

export function addMovement(data, values) {
  const label = nameFrom(values.name);
  const cents = asCents(values.cents);
  const date = requiredDate(values.date);
  if (date > localDate()) throw new Error('Usa el calendario para programar un pago futuro.');
  const month = date.slice(0, 7), day = Number(date.slice(8));
  const { kind, account, to } = values;
  const category = kind === 'income' ? 'ingreso' : kind === 'transfer' ? 'transferencia' : values.category;
  const origin = accounts.find(a => a.id === account);
  const destination = accounts.find(a => a.id === to);
  if (!['expense', 'income', 'transfer'].includes(kind) || !Object.hasOwn(categories, category) ||
      (kind === 'expense' && ['ingreso', 'transferencia'].includes(category)) ||
      !origin || (origin.created && month < origin.created) ||
      (kind === 'transfer' && (!destination || account === to || (destination.created && month < destination.created)))) {
    throw new Error('Revisa la cuenta, el tipo y la categoría.');
  }
  if (kind !== 'income' && reserved(account, data) > 0 && (balances()[account] - cents) < reserved(account, data)) {
    throw new Error('El monto supera el saldo disponible de esa cuenta.');
  }
  data.movements.push({ id: crypto.randomUUID(), kind, account, to: kind === 'transfer' ? to : undefined, label, cents, month, day, category });
  return month;
}

export function addGoal(data, values, id) {
  const prior = data.goals.find(goal => goal.id === id);
  const goal = {
    id: prior?.id ?? crypto.randomUUID(), label: nameFrom(values.name), target: asCents(values.target),
    saved: asCents(values.saved || '0', true), reserved: values.reserve === 'on',
    date: values.date ? requiredDate(values.date) : '', account: values.account,
  };
  if (!accounts.some(account => account.id === goal.account)) throw new Error('Elige una cuenta.');
  if (goal.reserved) {
    const alreadyReserved = reserved(goal.account, { goals: data.goals.filter(item => item.id !== id) });
    if (goal.saved > 0 && alreadyReserved + goal.saved > balances(newestMonth())[goal.account]) {
      throw new Error('La cuenta no tiene suficiente saldo disponible para esta reserva.');
    }
  }
  if (prior) data.goals[data.goals.indexOf(prior)] = goal;
  else data.goals.push(goal);
}
