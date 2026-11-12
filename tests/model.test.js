import test from 'node:test';
import assert from 'node:assert/strict';
import { accounts, balances, byDay, compareDay, daily, groups, latest, monthMovements, portfolio, previous, predictNextMonth, routes, sum, totals } from '../assets/model.js';

test('el pico de octubre conserva el total y permite identificar el alquiler', () => {
  const values = daily(latest);
  assert.equal(Math.max(...values), 148000);
  assert.equal(values.indexOf(148000) + 1, 15);
  const [top] = groups(byDay(latest, 15));
  assert.equal(top.category, 'hogar');
  assert.equal(top.cents, 127000);
  assert.equal(top.items.find(m => m.label === 'Alquiler · Miraflores').cents, 115000);
});

test('la diferencia del día 15 se descompone sin perder céntimos', () => {
  const d = compareDay(latest, previous, 15);
  assert.equal(d.delta, 95100);
  assert.equal(d.diffs.reduce((n, g) => n + g.delta, 0), d.delta);
  assert.deepEqual(d.diffs[0], { category: 'hogar', delta: 84000 });
  assert.equal(compareDay(latest, previous, 31), null);
});

test('una transferencia debita un origen y abona un destino sin afectar la cartera', () => {
  const sept = balances(previous), oct = balances(latest), t = totals(latest);
  for (const a of accounts) {
    const own = monthMovements(latest).filter(m => m.account === a.id);
    const transfersIn = monthMovements(latest).filter(m => m.to === a.id);
    assert.equal(oct[a.id], sept[a.id] + sum(own.filter(m => m.kind === 'income')) - sum(own.filter(m => m.kind !== 'income')) + sum(transfersIn));
  }
  assert.equal(t.transfer, 100000);
  assert.equal(portfolio(latest) - portfolio(previous), t.income - t.expense);
  assert.equal(sum(routes(latest)), t.expense);
});

test('el pronóstico usa el saldo de octubre y pondera el historial sin contar transferencias', () => {
  const report = predictNextMonth();
  assert.deepEqual(report.history, [previous, latest]);
  assert.equal(report.date.toISOString().slice(0, 10), '2026-11-01');
  assert.equal(report.opening, portfolio(latest));
  const estimate = kind => Math.round((totals(previous)[kind] + 2 * totals(latest)[kind]) / 3);
  assert.equal(report.income, estimate('income'));
  assert.equal(report.expense, estimate('expense'));
  assert.equal(report.closing, report.opening + report.income - report.expense);
  assert.deepEqual(report.series.at(-1), { day: 30, balance: 1077775 });
  // October 31 is folded into the last day of November, which has 30 days.
  const end = sum([...byDay(latest, 30), ...byDay(latest, 31)]);
  const expected = Math.round((sum(byDay(previous, 30)) + 2 * end) / 3);
  const lastChange = report.series.at(-2).balance - report.series.at(-1).balance;
  assert.ok(Math.abs(lastChange - expected) <= 1);
});

test('con un solo mes usa ese historial completo y con ninguno no inventa un saldo', () => {
  const report = predictNextMonth(previous);
  assert.equal(report.series.at(-1).day, 31);
  assert.equal(report.income, totals(previous).income);
  assert.equal(report.expense, totals(previous).expense);
  assert.equal(predictNextMonth('2026-08'), null);
});
