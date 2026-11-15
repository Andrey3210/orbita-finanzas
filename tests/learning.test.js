import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeCourse, lessons, redeemSimulation, restoreLearning, simulationStatus } from '../assets/learning.js';

const credit = lessons.find(course => course.id === 'credito');
const wallet = (overrides = {}) => {
  const learning = { coins: 0, completed: [], badges: [], ...overrides };
  restoreLearning(learning);
  return learning;
};

test('un quiz exige dos aciertos y solo paga una vez el curso y cada reto', () => {
  const learning = wallet();
  assert.deepEqual(gradeCourse(learning, credit, [0, 0, 0]), { score: 1, total: 3, passed: false, earned: 0 });
  assert.deepEqual(gradeCourse(learning, credit, [1, 0, 0]), { score: 2, total: 3, passed: true, earned: 25 });
  assert.equal(gradeCourse(learning, credit, [1, 0, 1]).earned, 10);
  assert.equal(gradeCourse(learning, credit, [1, 0, 1]).earned, 0);
  assert.equal(learning.coins, 35);
  assert.deepEqual(learning.history.map(entry => entry.change), [20, 5, 10]);
});

test('el canje exige curso y saldo incluso con Plus previo y solo debita una vez', () => {
  const rich = wallet({ coins: 50, plus: true });
  assert.equal(simulationStatus(rich, 'prestamo'), 'course');
  assert.equal(redeemSimulation(rich, 'prestamo'), false);
  assert.equal(rich.coins, 50);
  assert.equal(rich.history[0].label, 'Saldo anterior');
  const approved = wallet({ coins: 19, completed: ['credito'] });
  assert.equal(simulationStatus(approved, 'prestamo'), 'coins');
  assert.equal(redeemSimulation(approved, 'prestamo'), false);
  const funded = wallet({ coins: 20, completed: ['credito'] });
  assert.equal(redeemSimulation(funded, 'prestamo'), true);
  assert.equal(redeemSimulation(funded, 'prestamo'), false);
  assert.equal(simulationStatus(funded, 'prestamo'), 'unlocked');
  assert.equal(funded.coins, 0);
  assert.deepEqual(funded.history.map(entry => entry.change), [20, -20]);
});
