import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.ORBITA_URL ?? 'http://127.0.0.1:4176/';
const browser = await chromium.launch({ args: ['--disable-gpu'] });
const errors = [];
const observe = page => page.on('pageerror', err => errors.push(err.message));
const assertText = async (locator, expected) => assert.match(await locator.innerText(), expected);
const waitForMascot = (page, section) => page.waitForFunction(
  name => {
    const mascot = document.querySelector('.mascot-' + name);
    return mascot?.complete && mascot.naturalWidth === 512;
  },
  section,
);

try {
  await mkdir('test-results', { recursive: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  observe(mobile);
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: 'test-results/inicio-movil.png', fullPage: true, animations: 'disabled' });
  await assertText(mobile.locator('.hero-balance'), /10,425\.35/);
  await waitForMascot(mobile, 'inicio');
  await assertText(mobile.locator('.donut-total'), /5,916\.90/);
  const homeCategory = mobile.getByRole('button', { name: /Hogar, \d+%, S\/ 2,222\.00/ });
  await homeCategory.tap();
  await assertText(mobile.locator('.donut-total'), /Hogar[\s\S]*2,222\.00/);
  await homeCategory.tap();
  await assertText(mobile.locator('.donut-total'), /Total[\s\S]*5,916\.90/);
  await mobile.getByText('Resumen completo', { exact: true }).tap();
  await assertText(mobile.locator('.report-body'), /Saldo inicial[\s\S]*S\/ 10,643\.50[\s\S]*Transferencias propias[\s\S]*S\/ 1,000\.00[\s\S]*Gastos por categoría[\s\S]*Frente a septiembre/);
  await mobile.getByText('Resumen completo', { exact: true }).tap();
  const barScroll = mobile.locator('.bar-scroll');
  assert.ok(await barScroll.evaluate(el => el.scrollWidth > el.clientWidth));
  assert.ok((await mobile.locator('.bar-hit').first().boundingBox()).width >= 48);
  const dayPicker = mobile.getByRole('combobox', { name: 'Ir a un día' });
  await dayPicker.selectOption('31');
  await assertText(mobile.locator('#day-detail'), /31 de octubre[\s\S]*89\.00/);
  assert.ok(await barScroll.evaluate(el => el.scrollLeft > 1000));
  await dayPicker.selectOption('');
  await mobile.getByRole('button', { name: '15 de octubre: S/ 1,480.00' }).tap();
  await mobile.locator('.category-tile').filter({ hasText: 'Hogar' }).tap();
  await mobile.locator('#segment-detail').getByRole('button', { name: /Alquiler · Miraflores/ }).tap();
  await assertText(mobile.getByRole('dialog'), /1,150\.00/);
  await mobile.getByRole('button', { name: 'Cerrar detalle' }).tap();
  await mobile.getByRole('button', { name: 'Comparar este día' }).tap();
  await waitForMascot(mobile, 'explorar');
  await assertText(mobile.locator('.compare-detail'), /951\.00[\s\S]*840\.00/);
  await mobile.locator('[data-action="pick-compare"][data-value="20"]').tap();
  await assertText(mobile.locator('.compare-detail'), /DÍA 20/);
  await mobile.getByRole('combobox', { name: 'Día para comparar' }).selectOption('31');
  await assertText(mobile.locator('.compare-detail'), /Sin día equivalente/);
  await mobile.getByRole('link', { name: 'Pronóstico', exact: true }).tap();
  await waitForMascot(mobile, 'pronostico');
  await assertText(mobile.locator('.account-overview'), /10,777\.75[\s\S]*352\.40/);
  await assertText(mobile.locator('.forecast-metrics'), /5,353\.33[\s\S]*5,000\.93/);
  assert.equal(await mobile.locator('main button, main select').count(), 0);
  assert.ok((await mobile.locator('#forecast-line').getAttribute('d')).startsWith('M0'));
  await mobile.screenshot({ path: 'test-results/pronostico-movil.png', fullPage: true, animations: 'disabled' });
  await mobile.getByRole('link', { name: 'Cuentas', exact: true }).tap();
  await mobile.getByRole('heading', { name: 'Tus cuentas', exact: true }).waitFor({ timeout: 4000 });
  await waitForMascot(mobile, 'cuentas');
  await mobile.getByRole('button', { name: /Ahorro mensual/ }).tap();
  await assertText(mobile.getByRole('dialog'), /Cuenta principal[\s\S]*Ahorros[\s\S]*Transferencias/);
  await mobile.getByRole('button', { name: 'Cerrar detalle' }).tap();
  await mobile.getByRole('link', { name: 'Actividad', exact: true }).tap();
  await waitForMascot(mobile, 'actividad');
  await mobile.getByText('Filtros', { exact: true }).tap();
  await mobile.getByRole('combobox', { name: 'Filtrar por cuenta' }).selectOption('ahorros');
  await mobile.getByRole('combobox', { name: 'Filtrar por tipo' }).selectOption('transfer');
  await mobile.getByRole('searchbox', { name: 'Buscar movimientos' }).fill('ahorro');
  await assertText(mobile.locator('#activity-results'), /1 movimiento[\s\S]*Ahorro mensual/);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth), 390);

  // Drag across the floating navigation. The indicator follows each position
  // continuously while the section only changes after touchEnd.
  const bar = await mobile.locator('#nav').boundingBox();
  const barSession = await mobile.context().newCDPSession(mobile);
  const barY = bar.y + bar.height / 2;
  const from = bar.x + bar.width * .9, to = bar.x + bar.width * .1 + 10;
  const navTouch = (type, x) => barSession.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: barY }] });
  const offset = () => mobile.locator('#nav-indicator').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41);
  await navTouch('touchStart', from);
  await navTouch('touchMove', bar.x + bar.width * .61);
  await mobile.locator('#nav.is-dragging').waitFor();
  const firstOffset = await offset();
  await navTouch('touchMove', to);
  await mobile.waitForFunction(first => {
    const indicator = document.querySelector('#nav-indicator');
    return new DOMMatrix(getComputedStyle(indicator).transform).m41 < first - 40;
  }, firstOffset);
  assert.equal(await mobile.locator('#nav [aria-current]').innerText(), 'Actividad');
  await navTouch('touchEnd');
  await barSession.detach();
  assert.equal(await mobile.locator('#nav [aria-current]').innerText(), 'Inicio');
  await mobile.locator('#nav-indicator').evaluate(el => Promise.all(el.getAnimations().map(a => a.finished)));
  assert.ok(Math.abs(await offset() - 2) < 1);

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  observe(desktop);
  await desktop.goto(base, { waitUntil: 'networkidle' });
  await desktop.screenshot({ path: 'test-results/inicio-escritorio.png', fullPage: true, animations: 'disabled' });
  await desktop.getByRole('link', { name: 'Explorar', exact: true }).focus();
  await desktop.keyboard.press('Enter');
  await desktop.getByRole('button', { name: 'Comparar meses', exact: true }).first().click();
  await desktop.locator('[data-month-drag]').first().dragTo(desktop.locator('[data-month-target]').nth(1));
  assert.equal(await desktop.getByRole('combobox', { name: 'Mes base' }).inputValue(), '2026-09');
  await desktop.getByRole('button', { name: 'Flujo de dinero' }).click();
  await desktop.getByRole('combobox', { name: 'Ruta de dinero' }).selectOption('principal-hogar');
  await assertText(desktop.locator('.flow-panel .unfold'), /Cuenta principal → Hogar/i);
  assert.equal(await desktop.locator('.flow-route.lit').count(), 1);
  assert.ok(await desktop.locator('.flow-route.dim').count() > 0);
  await desktop.getByRole('link', { name: 'Pronóstico', exact: true }).click();
  await waitForMascot(desktop, 'pronostico');
  // The forecast stays anchored to the latest close even after browsing September.
  await assertText(desktop.locator('.account-overview'), /10,777\.75/);
  await desktop.emulateMedia({ reducedMotion: 'reduce' });
  await desktop.getByRole('link', { name: 'Explorar', exact: true }).click();
  assert.equal(await desktop.locator('animateMotion').count(), 0);

  // Verify the browser can install the manifest and the controlled app survives
  // an offline reload, including a mascot that wasn't loaded in the initial view.
  await desktop.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 12000 });
  const installCheck = await desktop.context().newCDPSession(desktop);
  const manifest = await installCheck.send('Page.getAppManifest');
  const manifestData = JSON.parse(manifest.data);
  assert.equal(manifestData.name, 'foxio');
  assert.equal(manifestData.id, '/orbita-finanzas/');
  assert.deepEqual((await installCheck.send('Page.getInstallabilityErrors')).installabilityErrors, []);
  await desktop.context().setOffline(true);
  await desktop.reload();
  await desktop.getByRole('link', { name: 'Actividad', exact: true }).click();
  await waitForMascot(desktop, 'actividad');
  await assertText(desktop.locator('#activity-results'), /movimientos/);
  await desktop.context().setOffline(false);

  assert.deepEqual(errors, []);
  console.log('Navegador: recorrido móvil, cinco poses, arrastre, movimiento reducido, instalación y reapertura sin conexión verificados.');
} finally {
  await browser.close();
}
