import test from 'node:test';
import assert from 'node:assert/strict';
import { accounts, balances, byDay, compareDay, defaultDates, daily, groups, latest, monthMovements, portfolio, previous, project, routes, sum, totals } from '../assets/model.js';

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

test('mover el cobro avisa el primer faltante exacto y no cambia el plan original', () => {
  const moved = project({ ...defaultDates(), cobro: 7 });
  assert.deepEqual(moved.find(p => p.balance < 0), { day: 6, balance: -34000 });
  assert.equal(project().some(p => p.balance < 0), false);
  assert.equal(moved.at(-1).balance, project().at(-1).balance);
});
