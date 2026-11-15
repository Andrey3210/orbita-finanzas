import { accounts, categories, expenses, monthlyReport, months, money, newestMonth, period, predictNextMonth, shiftMonth, signed } from './model.js?v=miluka-2';
import { saveAccount, addGoal, addMovement, asCents, localDate, nameFrom, personal, requiredDate, reserved, updatePersonal } from './personal.js?v=miluka-2';
import { challenges, completeChallenge, courseCoins, gradeCourse, lessons, milestones, news, passingScore, quizFor, redeemBadge, redeemSimulation, rewards, simulationRequirements, simulations, simulationStatus } from './learning.js?v=miluka-2';

export const escapeText = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const localMoney = cents => signed(cents).replace(/^\+/, '');
const kindOptions = [['expense', 'Gasto'], ['income', 'Ingreso'], ['transfer', 'Transferencia']];
const dateLabel = date => date ? new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(date + 'T00:00:00Z')) : '';
const accountOptions = () => accounts.map(a => [a.id, a.label]);
const categoryOptions = expenses.map(id => [id, categories[id].label]);
const paidLabel = item => item.paid ? 'Pagado' : item.date < localDate() ? 'Vencido' : 'Pendiente';
const levels = ['Principiante', 'Intermedio', 'Avanzado'];
const lessonAndGames = [...lessons, ...challenges];
const prompts = ['¿En qué gasté más?', '¿Cuánto puedo usar?', '¿Qué pagos se acercan?'];
const findActivity = (id, data = personal) => lessonAndGames.find(item => item.id === id) ?? (data.learning.generated?.id === id ? data.learning.generated : undefined);
const courseById = id => lessons.find(course => course.id === id);
const coinLabel = amount => amount + (amount === 1 ? ' moneda' : ' monedas');

export function createModules({ main, state, action, icon, select, heading, monthName, render, navigate, forecastView }) {
  const editor = document.querySelector('#module-dialog');
  const tabs = (name, group, items) => `<div class="view-tabs module-tabs" aria-label="${name}">${items.map(([value, label]) => `<button ${action(group, value)} aria-pressed="${state[group] === value}">${label}</button>`).join('')}</div>`;
  const organizeTabs = () => tabs('Vistas de Organízate', 'organize', [['cuentas', 'Cuentas'], ['historial', 'Historial'], ['calendario', 'Calendario']]);
  const exploreTabs = () => tabs('Vistas de Explorar', 'explore', [['retos', 'Retos'], ['cursos', 'Cursos'], ['simuladores', 'Simuladores'], ['rutas', 'Rutas'], ['actualidad', 'Actualidad'], ['datos', 'Mis datos']]);
  const formButton = (label, id) => `<button class="subtle-button" ${action('form', id)}>${icon('plus', 16)} ${label}</button>`;
  const rowLink = (label, hint, glyph, command, id) => `<button class="list-link" ${action(command, id)}><span class="badge-icon">${icon(glyph)}</span><span><strong>${escapeText(label)}</strong>${hint ? `<small>${escapeText(hint)}</small>` : ''}</span>${icon('chevron', 17)}</button>`;

  function savingsPanel(month) {
    const keys = Object.keys(months).sort().filter(key => key <= month).slice(-4);
    const series = keys.map(key => ({ key, value: monthlyReport(key).net }));
    const max = Math.max(1, ...series.map(item => Math.abs(item.value)));
    return `<section class="panel block savings-panel"><div class="panel-head"><h2>Ahorro</h2><strong class="${series.at(-1).value < 0 ? 'negative' : 'positive'}">${signed(series.at(-1).value)}</strong></div>
      <div class="savings-chart" aria-label="Ahorro neto, ingresos menos gastos">
        ${series.map(({ key, value }) => `<div class="savings-slot" aria-label="${monthName(key)}: ${signed(value)}"><div class="savings-track"><i class="${value < 0 ? 'below' : ''}" style="--level:${Math.abs(value) / max * 100}%"></i></div><span>${period(key).short}.</span></div>`).join('')}
      </div></section>`;
  }

  function paymentRow(item, editable) {
    return `<div class="payment-row"><span class="badge-icon">${icon(item.paid ? 'check' : 'calendar', 17)}</span><span><strong>${escapeText(item.label)}</strong><small class="${paidLabel(item) === 'Vencido' ? 'negative' : ''}">${dateLabel(item.date)} · ${paidLabel(item)}</small></span><strong>${money(item.cents)}</strong>
      ${editable ? `<button class="subtle-button icon-button" aria-label="${item.paid ? 'Marcar pendiente' : 'Marcar pagado'}: ${escapeText(item.label)}" ${action('pay', item.id)}>${icon(item.paid ? 'reset' : 'check', 16)}</button>` : ''}</div>`;
  }

  function upcomingPanel() {
    const due = personal.payments.filter(item => !item.paid).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 2);
    return `<section class="panel block upcoming-panel"><div class="panel-head"><h2>Próximos pagos</h2><button class="subtle-button icon-button" aria-label="Abrir calendario" ${action('calendar-open')}>${icon('chevron', 17)}</button></div>
    ${due.length ? due.map(item => paymentRow(item, false)).join('') : '<p class="empty">Sin pagos pendientes.</p>'}</section>`;
  }

  function calendarView() {
    const key = state.calendarMonth;
    const entries = personal.payments.filter(item => item.date.startsWith(key)).sort((a, b) => a.date.localeCompare(b.date));
    const start = (new Date(key + '-01T00:00:00Z').getUTCDay() + 6) % 7;
    const today = localDate();
    return `<section class="panel block calendar-panel"><div class="panel-head"><h2>Pagos</h2>${formButton('Pago', 'payment')}</div>
      <div class="calendar-month"><button class="subtle-button icon-button previous" aria-label="Mes anterior del calendario" ${action('calendar-month', '-1')}>${icon('chevron', 18)}</button><strong>${monthName(key)} ${key.slice(0, 4)}</strong><button class="subtle-button icon-button" aria-label="Mes siguiente del calendario" ${action('calendar-month', '1')}>${icon('chevron', 18)}</button></div>
      <div class="calendar-grid">${['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(day => `<b>${day}</b>`).join('')}${'<span></span>'.repeat(start)}
        ${Array.from({ length: period(key).days }, (_, index) => {
          const date = key + '-' + String(index + 1).padStart(2, '0');
          const due = entries.filter(item => item.date === date);
          return `<button ${action('calendar-day', date)} aria-label="${dateLabel(date)}${due.length ? ', ' + due.map(paidLabel).join(', ') : ''}" aria-pressed="${state.calendarDay === date}" ${date === today ? 'aria-current="date"' : ''}>${index + 1}${due.length ? `<i class="${due.some(item => !item.paid) ? 'due' : 'paid'}"></i>` : ''}</button>`;
        }).join('')}
      </div><div class="calendar-payments">${entries.filter(item => !state.calendarDay || item.date === state.calendarDay).map(item => paymentRow(item, true)).join('') || '<p class="empty">Sin pagos para esta fecha.</p>'}</div></section>`;
  }

  function goalsView() {
    const goals = personal.goals;
    const percent = goal => Math.min(100, Math.round(goal.saved / goal.target * 100));
    const overall = goals.length ? Math.round(goals.reduce((n, goal) => n + percent(goal), 0) / goals.length) : 0;
    return heading('Mis metas') + `<section class="panel block"><div class="panel-head"><div><h2>${overall}%</h2><p class="empty">${goals.length} ${goals.length === 1 ? 'meta' : 'metas'}</p></div><button class="primary-button" ${action('form', 'goal')}>${icon('plus', 17)} Crear meta</button></div>
      <div class="goal-grid">${goals.map(goal => `<article class="goal-card"><div class="panel-head"><h3>${escapeText(goal.label)}</h3><button class="subtle-button icon-button" aria-label="Editar ${escapeText(goal.label)}" ${action('goal-edit', goal.id)}>${icon('chevron', 16)}</button></div>
        <p><strong>${money(goal.saved)}</strong> <span>de ${money(goal.target)}</span></p><progress max="100" value="${percent(goal)}" aria-label="${percent(goal)}% de avance"></progress>
        <small class="${goal.date && goal.date < localDate() && goal.saved < goal.target ? 'negative' : ''}">${goal.saved >= goal.target ? 'Completada' : goal.date && goal.date < localDate() ? 'Necesita atención' : goal.reserved ? 'Dinero reservado' : goal.date ? dateLabel(goal.date) : 'En curso'}</small></article>`).join('')}</div></section>`;
  }

  function learningView() {
    const progress = personal.learning;
    const course = lesson => {
      const status = progress.completed.includes(lesson.id) ? 'Aprobado' : coinLabel(courseCoins) + ' al aprobar';
      return rowLink(lesson.title, status, lesson.icon, 'lesson', lesson.id);
    };
    if (state.explore === 'rutas') {
      const rank = Math.max(0, levels.indexOf(progress.level));
      const routes = [...new Set(lessons.map(lesson => lesson.route))];
      return `<div class="learning-grid">${routes.map((route, index) => `<section class="panel block learning-route" style="--route-order:${index === rank ? -1 : index}"><div class="panel-head"><h2>${route}</h2>${index === rank ? '<span class="pill">Sugerida</span>' : ''}</div>${lessons.filter(lesson => lesson.route === route).map(course).join('')}</section>`).join('')}</div>`;
    }
    if (state.explore === 'cursos') return `<section class="panel block"><div class="panel-head"><h2>Cursos</h2></div>${lessons.map(course).join('')}</section>`;
    if (state.explore === 'actualidad') return `<div class="learning-grid">${news.map((item, index) => `<article class="panel block news-card"><small>${item.source}</small><h2>${item.title}</h2><details><summary>Impacto en Perú</summary><p>${item.impact}</p>${window.LanguageModel ? `<button class="subtle-button" ${action('news-ai', index)}>Ampliar con IA</button><p class="form-feedback" role="status"></p>` : ''}</details><a href="${item.url}" target="_blank" rel="noopener">Leer informe ${icon('arrowRight', 16)}</a></article>`).join('')}</div>`;
    if (state.explore === 'simuladores') return `<section class="panel block"><div class="panel-head"><h2>Simuladores</h2><span class="pill">${coinLabel(progress.coins)}</span></div>
      ${Object.entries(simulations).map(([id, scenario]) => {
        const { course, cost } = simulationRequirements[id];
        const status = simulationStatus(progress, id);
        const hint = status === 'unlocked' ? 'Desbloqueado' : status === 'course' ? `Aprueba «${courseById(course).title}» · ${coinLabel(cost)}` :
          status === 'coins' ? `Faltan ${coinLabel(cost - progress.coins)}` : `Canjear por ${coinLabel(cost)}`;
        return rowLink(scenario.label, hint, status === 'unlocked' ? 'trend' : 'vault', 'simulation', id);
      }).join('')}</section>`;
    return challengeHub(progress, course);
  }

  function challengeHub(progress, course) {
    const games = progress.generated ? [...challenges, progress.generated] : challenges;
    const pending = lessons.filter(item => !progress.completed.includes(item.id));
    const done = lessons.length - pending.length;
    return `<section class="game-wallet">
      <div><h2>Mi billetera</h2><p><strong>${progress.coins}</strong> ${progress.coins === 1 ? 'moneda' : 'monedas'}</p></div>
      <span class="wallet-glyph">${icon('coins', 34)}</span>
      <details class="coin-history"><summary>Historial de monedas ${icon('chevronDown', 16)}</summary>
        ${progress.history.length ? `<ul>${[...progress.history].reverse().map(entry => `<li><span>${escapeText(entry.label)}</span><strong>${entry.change > 0 ? '+' : '−'}${Math.abs(entry.change)}</strong></li>`).join('')}</ul>` : '<p>Aquí verás las monedas ganadas y usadas.</p>'}</details>
    </section>
    <div class="learning-grid challenge-grid">
      <section class="panel block"><div class="panel-head"><h2>Retos</h2><span class="pill">${progress.milestones.length}/${milestones.length} logrados</span></div>
        ${milestones.map(item => {
          const value = Math.min(item.target, item.progress(progress));
          const achieved = progress.milestones.includes(item.id);
          return `<div class="challenge-row"><span class="badge-icon">${icon(achieved ? 'check' : 'target')}</span>
            <div><strong>${item.title}</strong><small>${item.description}</small><progress value="${value}" max="${item.target}" aria-label="${item.title}: ${value} de ${item.target}"></progress></div>
            <span class="pill">${achieved ? 'Logrado' : '+' + item.coins}</span></div>`;
        }).join('')}
        <details class="game-more"><summary>Retos de práctica ${icon('chevronDown', 16)}</summary>
          ${games.map(item => rowLink(item.title, progress.completed.includes(item.id) ? 'Completado' : '+10 monedas', 'spark', 'lesson', item.id)).join('')}
          ${window.LanguageModel && !progress.generated ? `<button class="subtle-button" ${action('generate-game')}>Crear reto con IA</button><p class="form-feedback" id="game-feedback" role="status"></p>` : ''}
        </details>
      </section>
      <section class="panel block"><div class="panel-head"><h2>Aprendizaje</h2><span class="pill">${done}/${lessons.length} cursos</span></div>
        ${rowLink(progress.level || 'Descubre tu nivel', progress.level ? 'Repetir diagnóstico' : 'Evaluación de nivel', 'compass', 'diagnostic')}
        <details class="game-more"><summary>Cursos pendientes ${icon('chevronDown', 16)}</summary>${pending.length ? pending.map(course).join('') : '<p class="empty">Aprobaste todos los cursos.</p>'}</details>
      </section>
      <section class="panel block game-rewards"><div class="panel-head"><h2>Recompensas</h2><span class="pill">${progress.unlocked.length + progress.badges.length} obtenidas</span></div>
        ${rowLink('Simuladores', `${progress.unlocked.length}/${Object.keys(simulations).length} desbloqueados`, 'trend', 'explore', 'simuladores')}
        <details class="game-more"><summary>Insignias ${icon('chevronDown', 16)}</summary>${rewards.map(reward => `<div class="payment-row"><span class="badge-icon">${icon(reward.icon)}</span><strong>${reward.label}</strong><button class="subtle-button" ${action('reward', reward.id)} ${progress.badges.includes(reward.id) || progress.coins < reward.cost ? 'disabled' : ''}>${progress.badges.includes(reward.id) ? 'Canjeada' : coinLabel(reward.cost)}</button></div>`).join('')}</details>
      </section>
    </div>`;
  }

  let messages = [];
  let forecastOpen = false;
  function assistantView() {
    return heading('Asistente') + `<section class="panel block assistant-panel"><div class="panel-head"><h2>Pregunta a Miluka</h2></div>
      <div class="chat-log" role="log" aria-label="Conversación">${messages.map(item => `<p class="chat-bubble ${item.user ? 'is-user' : ''}">${escapeText(item.text)}</p>`).join('')}</div>
      <div class="chat-suggestions">${prompts.map((question, index) => `<button class="subtle-button" ${action('prompt', index)}>${question}</button>`).join('')}</div>
      <form id="chat-form"><input name="question" type="text" aria-label="Tu consulta" placeholder="Escribe una pregunta" autocomplete="off" maxlength="240" required><button class="primary-button icon-button" aria-label="Enviar pregunta">${icon('arrowUp', 19)}</button></form>
      ${personal.learning.plus ? `<div class="voice-controls">
        ${(window.SpeechRecognition || window.webkitSpeechRecognition) ? `<button class="subtle-button" ${action('voice')}>${icon('mic', 16)} Dictar</button>` : ''}
        ${window.speechSynthesis && messages.length ? `<button class="subtle-button" ${action('speak')}>Escuchar respuesta</button>` : ''}</div>` :
        ((window.SpeechRecognition || window.webkitSpeechRecognition || window.speechSynthesis) ? `<details class="game-more"><summary>Voz en demo Plus ${icon('chevronDown', 16)}</summary><button class="subtle-button" ${action('plus')}>Activar voz</button></details>` : '')}
      <p class="chat-note">Respuestas con tus datos en este dispositivo.</p><p class="sr-only" id="voice-status" role="status"></p></section>
      <details class="forecast-disclosure" ${forecastOpen ? 'open' : ''}><summary>Ver pronóstico ${icon('chevronDown', 17)}</summary>${forecastView()}</details>`;
  }

  function answer(question) {
    const q = question.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const month = newestMonth();
    const report = monthlyReport(month);
    if (/meta|reserv/.test(q)) return personal.goals.length ? personal.goals.map(goal => `${goal.label}: faltan ${money(Math.max(0, goal.target - goal.saved))}.`).join(' ') : 'Todavía puedes crear tu primera meta.';
    if (/pag|venc|record/.test(q)) {
      const due = personal.payments.filter(item => !item.paid).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
      return due.length ? due.map(item => `${item.label}: ${money(item.cents)} el ${dateLabel(item.date)}${item.date < localDate() ? ' (vencido)' : ''}.`).join(' ') : 'No tienes pagos pendientes.';
    }
    if (/pron[oó]st|futuro|proxim[oa] mes|proyec/.test(q)) return `Si sigues con el patrón del historial, el saldo estimado del próximo mes es ${localMoney(predictNextMonth().closing)}.`;
    if (/gasto|gaste|gastar|categoria|comida|transporte/.test(q)) {
      const group = report.byCategory.find(item => q.includes(item.category)) ?? report.byCategory[0];
      return group ? `En ${monthName(month).toLowerCase()} registraste ${money(report.expense)} en gastos. ${categories[group.category].label} suma ${money(group.cents)}.` : 'Este mes no tienes gastos registrados.';
    }
    if (/ingres|ahorr|balance/.test(q)) return `En ${monthName(month).toLowerCase()} registraste ${money(report.income)} de ingresos y ${money(report.expense)} de gastos. Tu balance es ${signed(report.net)}.`;
    if (/saldo|puedo|dinero|cuenta|disponible/.test(q)) return `Tienes ${localMoney(report.closing - reserved())} disponibles.${reserved() ? ` Has reservado ${money(reserved())} para tus metas.` : ''}`;
    return null;
  }

  async function localAI(question, instructions) {
    const model = window.LanguageModel;
    const language = { type: 'text', languages: ['es'] };
    const options = { expectedInputs: [language], expectedOutputs: [language] };
    let session;
    try {
      if (await model?.availability(options) !== 'available') return null;
      session = await model.create({ ...options, initialPrompts: [{ role: 'system', content: instructions }] });
      return (await session.prompt(question)).trim() || null;
    } catch {
      return null;
    } finally {
      session?.destroy();
    }
  }

  async function sendOpenQuestion(question) {
    const message = { user: false, text: 'Consultando…' };
    messages = [...messages, { user: true, text: question }, message].slice(-24);
    renderChat();
    const report = monthlyReport(newestMonth());
    const context = [
      'Responde en español y en dos frases como máximo. Da orientación educativa de finanzas personales.',
      'Usa solo los montos dados. Si falta información, dilo. Evita recomendaciones de productos.',
      `Saldo disponible ${localMoney(report.closing - reserved())}, ingresos ${money(report.income)}, gastos ${money(report.expense)}.`,
    ].join(' ');
    message.text = await localAI(question, context) ?? 'Puedo revisar tus gastos, ingresos, saldo, pagos, metas o pronóstico. Prueba con «¿Cuánto gasté este mes?».';
    if (state.section === 'asistente') {
      const log = main.querySelector('.chat-log');
      const item = log.children[messages.indexOf(message)];
      if (item) item.textContent = message.text;
      log.scrollTop = log.scrollHeight;
    }
  }

  function renderChat() {
    render({ focus: '#chat-form input' });
    const log = main.querySelector('.chat-log');
    log.scrollTop = log.scrollHeight;
  }

  function send(question) {
    const clean = question.trim().slice(0, 240);
    if (!clean) return;
    forecastOpen = main.querySelector('.forecast-disclosure')?.open ?? false;
    const reply = answer(clean);
    if (!reply) { void sendOpenQuestion(clean); return; }
    messages = [...messages, { user: true, text: clean }, { user: false, text: reply }].slice(-24);
    renderChat();
  }

  const field = (label, name, options = {}) => `<label class="form-field">${label}<input name="${name}" type="${options.type ?? 'text'}" value="${escapeText(options.value ?? '')}" ${options.max ? `max="${options.max}"` : ''} ${options.decimal ? 'inputmode="decimal"' : ''} ${options.optional ? '' : 'required'}></label>`;
  const choice = (label, name, options, selected = '') => `<div class="form-field"><label for="edit-${name}">${label}</label><span class="select-wrap"><select id="edit-${name}" name="${name}">${options.map(([id, text]) => `<option value="${escapeText(id)}" ${id === selected ? 'selected' : ''}>${escapeText(text)}</option>`).join('')}</select>${icon('chevronDown', 13)}</span></div>`;
  const centsInput = (label, name, cents = '', optional = false) => field(label, name, { value: cents === '' ? '' : (cents / 100).toFixed(2), decimal: true, optional });
  const close = () => `<form method="dialog"><button class="subtle-button icon-button" aria-label="Cerrar">${icon('close', 18)}</button></form>`;
  function openDialog(title, content) {
    editor.innerHTML = `<div class="dialog-head"><h2 id="module-title" tabindex="-1">${title}</h2>${close()}</div>${content}`;
    if (!editor.open) editor.showModal();
    else {
      editor.scrollTop = 0;
      editor.querySelector('#module-title').focus({ preventScroll: true });
    }
  }

  function openForm(kind, id) {
    let title, fields;
    const goal = personal.goals.find(item => item.id === id);
    if (kind === 'account') {
      const current = accounts.find(account => account.id === id);
      title = current ? 'Editar cuenta' : 'Nueva cuenta';
      fields = field('Nombre', 'name', { value: current?.label }) + (current ? '' : centsInput('Saldo inicial (S/)', 'cents', '', true));
    } else if (kind === 'movement' || kind === 'receipt') {
      title = kind === 'receipt' ? 'Escanear boleta' : 'Nuevo movimiento';
      fields = (kind === 'receipt' ? '<label class="form-field">Foto de la boleta<input name="receipt" type="file" accept="image/*" capture="environment"></label><p class="form-feedback" id="receipt-status" role="status">Sube una foto y revisa los campos antes de guardar.</p>' : '')
        + choice('Tipo', 'kind', kindOptions) + field('Motivo', 'name')
        + centsInput('Monto (S/)', 'cents') + field('Fecha', 'date', { type: 'date', value: localDate(), max: localDate() })
        + choice('Cuenta', 'account', accountOptions())
        + `<div data-category-field>${choice('Categoría', 'category', categoryOptions)}</div><div data-destination-field hidden>${choice('Cuenta de destino', 'to', accountOptions(), accounts[1].id)}</div>`;
    } else if (kind === 'payment') {
      title = 'Programar pago';
      fields = field('Obligación', 'name') + centsInput('Monto (S/)', 'cents') + field('Vence', 'date', { type: 'date', value: state.calendarDay ?? localDate() });
    } else {
      title = goal ? 'Editar meta' : 'Nueva meta';
      fields = field('Nombre', 'name', { value: goal?.label }) + centsInput('Objetivo (S/)', 'target', goal?.target)
        + centsInput('Ya ahorrado (S/)', 'saved', goal?.saved, true) + field('Fecha objetivo', 'date', { type: 'date', value: goal?.date, optional: true })
        + choice('Cuenta', 'account', accountOptions(), goal?.account ?? 'ahorros')
        + `<label class="checkbox-field"><input name="reserve" type="checkbox" ${goal?.reserved ? 'checked' : ''}> Reservar del saldo disponible</label>`;
    }
    openDialog(title, `<form class="module-form" data-form="${kind}" data-id="${id ?? ''}">${fields}<p class="form-feedback negative" role="alert"></p><button class="primary-button" type="submit">Guardar</button></form>`);
  }

  function openLesson(id) {
    const item = findActivity(id);
    if (!item) return;
    if (courseById(id)) {
      const approved = personal.learning.completed.includes(id);
      openDialog(item.title, `<div class="module-form">
        <p class="course-status">${approved ? 'Curso aprobado' : '+' + coinLabel(courseCoins) + ' al aprobar'}</p>
        <p>${item.reading}</p><p class="lesson-example">${item.example}</p>
        <a class="lesson-resource" href="https://www.sbs.gob.pe/material-de-educacion-financiera" target="_blank" rel="noopener">Material y videos de la SBS ${icon('arrowRight', 16)}</a>
        <button class="primary-button" data-editor-action="quiz" data-value="${id}">${approved ? 'Repetir quiz' : 'Empezar quiz'}</button></div>`);
      return;
    }
    const answered = personal.learning.completed.includes(id);
    openDialog(escapeText(item.title), `<form class="module-form" data-form="lesson" data-id="${id}">
      ${questionFields(item, 'answer')}<p class="form-feedback" role="status">${answered ? 'Actividad completada' : ''}</p>
      <button class="primary-button">Comprobar</button></form>`);
  }

  function questionFields(item, name) {
    return `<fieldset><legend>${escapeText(item.question)}</legend>${item.options.map((option, index) =>
      `<label class="answer-option"><input type="radio" name="${name}" value="${index}" required> ${escapeText(option)}</label>`).join('')}</fieldset>`;
  }

  function openQuiz(id) {
    const course = courseById(id);
    const quiz = quizFor(course);
    openDialog(course.title, `<form class="module-form" data-form="quiz" data-id="${id}">
      <p class="course-status">Quiz final · Aprueba con ${passingScore} de ${quiz.length}</p>
      ${quiz.map((item, i) => questionFields(item, 'q' + i)).join('')}
      <p class="form-feedback" role="alert"></p><button class="primary-button">Ver resultado</button></form>`);
  }

  function openDiagnostic() {
    openDialog('Descubre tu nivel', `<form class="module-form" data-form="diagnostic">${[lessons[0], lessons[2], lessons[3]].map((item, i) =>
      questionFields(item, 'q' + i)).join('')}
      <p class="form-feedback" role="alert"></p><button class="primary-button">Ver mi nivel</button></form>`);
  }

  function openSimulation(id) {
    const scenario = simulations[id];
    if (!scenario || simulationStatus(personal.learning, id) !== 'unlocked') return;
    openDialog(scenario.label, `<form class="module-form" data-form="simulation" data-id="${id}">${scenario.fields.map(([label, value], index) =>
      `<label class="form-field">${label}<input type="number" inputmode="decimal" min="${index === 2 && ['prestamo', 'tarjeta', 'inversiones'].includes(id) ? 1 : 0}" max="${index === 2 && ['prestamo', 'tarjeta', 'inversiones'].includes(id) ? 360 : 10000000}" step="${index === 2 && id !== 'presupuesto' ? 1 : .01}" name="n${index}" value="${value}" required></label>`).join('')}
      <div class="simulation-result"><span>${scenario.result}</span><output aria-live="polite"></output></div>${scenario.note ? `<p class="chat-note">${scenario.note}</p>` : ''}</form>`);
    updateSimulation(editor.querySelector('form[data-form]'));
  }

  function chooseSimulation(id) {
    const status = simulationStatus(personal.learning, id);
    const { course, cost } = simulationRequirements[id];
    const title = simulations[id].label;
    if (status === 'unlocked') { openSimulation(id); return; }
    if (status === 'course') {
      const item = courseById(course);
      openDialog(title, `<div class="module-form"><p>Aprueba «${item.title}» y reúne ${coinLabel(cost)} para desbloquear este simulador.</p>
        <button class="primary-button" data-editor-action="course" data-value="${course}">Ver curso</button></div>`);
      return;
    }
    if (status === 'coins') {
      openDialog(title, `<div class="module-form"><p>Curso aprobado. Te faltan ${coinLabel(cost - personal.learning.coins)} para desbloquear el simulador.</p>
        <button class="primary-button" data-editor-action="retos">Ver retos</button></div>`);
      return;
    }
    openDialog('Desbloquear ' + title.toLowerCase(), `<form class="module-form" data-form="redeem" data-id="${id}">
      <p>Usarás <strong>${coinLabel(cost)}</strong>. Te quedarán ${coinLabel(personal.learning.coins - cost)}.</p>
      <p class="form-feedback" role="alert"></p><button class="primary-button" type="submit">Confirmar canje</button></form>`);
  }

  function updateSimulation(form) {
    const output = form.querySelector('output');
    if (!form.checkValidity()) { output.textContent = 'Revisa los valores'; return; }
    const scenario = simulations[form.dataset.id];
    const result = scenario.calc(...scenario.fields.map((_, index) => Number(form.elements['n' + index].value)));
    output.textContent = Number.isFinite(result) && Number.isSafeInteger(Math.round(result * 100)) ? localMoney(Math.round(result * 100)) : 'Fuera de rango';
  }

  async function generateGame() {
    const status = main.querySelector('#game-feedback');
    const button = main.querySelector('[data-action="generate-game"]');
    button.disabled = true;
    status.textContent = 'Creando reto…';
    try {
      const result = await localAI(
        'Genera un reto breve de presupuesto para un estudiante en Perú. Nivel: ' + (personal.learning.level || levels[0]),
        'Responde solo con un objeto JSON: question (texto), options (tres textos distintos), answer (índice correcto 0 a 2), example (explicación breve). Incluye un solo caso cotidiano y un resultado comprobable.',
      );
      if (!result) throw new Error('La IA del navegador no está disponible. Puedes jugar los otros retos.');
      const { question, options, answer, example } = JSON.parse(result.replace(/^```(?:json)?\s*|\s*```$/gi, ''));
      if (!Array.isArray(options) || options.length !== 3 || ![0, 1, 2].includes(answer) ||
          ![question, example, ...options].every(text => typeof text === 'string' && text.trim() && text.length <= 360)) {
        throw new Error('El reto quedó incompleto. Intenta de nuevo.');
      }
      updatePersonal(({ learning }) => {
        learning.generated ??= { id: 'reto-ia', title: 'Reto creado con IA', question, options, answer, example };
      });
      if (state.section === 'explorar' && state.explore === 'retos') render();
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? 'El reto quedó incompleto. Intenta de nuevo.' : error.message;
      button.disabled = false;
    }
  }

  async function explainNews(index) {
    const button = main.querySelector(`[data-action="news-ai"][data-value="${index}"]`);
    const status = button.nextElementSibling;
    const item = news[index];
    button.disabled = true;
    status.textContent = 'Consultando…';
    status.textContent = await localAI(item.title + '. ' + item.impact,
      'Explica en español, en dos frases, cómo el efecto descrito podría reflejarse en el presupuesto de un estudiante en Perú. Usa solo la información dada, sin añadir cifras, noticias ni pronósticos.') ??
      'El modelo del navegador no está disponible.';
    button.disabled = false;
  }

  function handleAction(id, value, focus) {
    try {
      switch (id) {
        case 'organize': case 'explore': state[id] = value; render({ focus }); break;
        case 'calendar-open': state.organize = 'calendario'; navigate('organiza'); break;
        case 'calendar-month': state.calendarMonth = shiftMonth(state.calendarMonth, Number(value)); state.calendarDay = ''; render({ focus }); break;
        case 'calendar-day': state.calendarDay = state.calendarDay === value ? '' : value; render({ focus }); break;
        case 'form': openForm(value); break;
        case 'account-edit': openForm('account', value); break;
        case 'goal-edit': openForm('goal', value); break;
        case 'pay':
          updatePersonal(data => { const payment = data.payments.find(item => item.id === value); payment.paid = !payment.paid; });
          render({ focus }); break;
        case 'lesson': openLesson(value); break;
        case 'generate-game': void generateGame(); break;
        case 'news-ai': void explainNews(Number(value)); break;
        case 'diagnostic': openDiagnostic(); break;
        case 'simulation': chooseSimulation(value); break;
        case 'plus': updatePersonal(data => { data.learning.plus = true; }); render(); break;
        case 'reward': {
          const reward = rewards.find(item => item.id === value);
          updatePersonal(({ learning }) => redeemBadge(learning, reward));
          render(); break;
        }
        case 'prompt': send(prompts[Number(value)]); break;
        case 'voice': dictate(); break;
        case 'speak': {
          const reply = new SpeechSynthesisUtterance(messages.at(-1).text);
          reply.lang = 'es-PE';
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(reply);
          break;
        }
      }
    } catch (error) {
      openDialog('No se pudo guardar', `<p class="empty">${escapeText(error.message)}</p>`);
    }
  }

  function dictate() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const status = main.querySelector('#voice-status');
    const recognition = new Recognition();
    recognition.lang = 'es-PE';
    recognition.onresult = event => {
      const input = main.querySelector('#chat-form input');
      if (input) { input.value = event.results[0][0].transcript; input.focus(); }
      status.textContent = 'Dictado listo para revisar.';
    };
    recognition.onerror = () => { status.textContent = 'El dictado no está disponible. Puedes escribir la consulta.'; };
    status.textContent = 'Escuchando';
    recognition.start();
  }

  main.addEventListener('submit', event => {
    if (event.target.id !== 'chat-form') return;
    event.preventDefault();
    send(event.target.elements.question.value);
  });
  main.addEventListener('toggle', event => {
    if (event.target.matches('.forecast-disclosure')) forecastOpen = event.target.open;
  }, true);

  editor.addEventListener('submit', event => {
    const form = event.target;
    const { form: kind, id } = form.dataset;
    if (!kind) return;
    event.preventDefault();
    if (kind === 'simulation') return;
    const values = Object.fromEntries(new FormData(form));
    const feedback = form.querySelector('.form-feedback:not(#receipt-status)');
    try {
      if (kind === 'quiz') {
        const course = courseById(id);
        let result;
        updatePersonal(({ learning }) => {
          result = gradeCourse(learning, course, quizFor(course).map((_, i) => Number(values['q' + i])));
        });
        const status = result.passed ? 'Curso aprobado' : 'Refuerza el contenido';
        const detail = result.earned ? `<p class="coin-earned">+${coinLabel(result.earned)} en tu billetera</p>` :
          (result.passed ? '<p>Ya recibiste la recompensa de este curso.</p>' : '<p>Repasa la lección y vuelve a intentarlo.</p>');
        openDialog('Resultado del quiz', `<div class="module-form quiz-result" role="status"><strong>${result.score}/${result.total}</strong><h3>${status}</h3>${detail}</div>
          <button class="primary-button quiz-result-action" data-editor-action="${result.passed ? 'retos' : 'course'}" data-value="${id}">${result.passed ? 'Ir a Retos' : 'Repasar lección'}</button>`);
        render();
        return;
      }
      if (kind === 'redeem') {
        updatePersonal(({ learning }) => {
          if (!redeemSimulation(learning, id)) throw new Error('El canje ya no está disponible. Revisa tu saldo y los cursos aprobados.');
        });
        openDialog('Simulador desbloqueado', `<div class="module-form"><p role="status">Canjeaste ${coinLabel(simulationRequirements[id].cost)}. Saldo: ${coinLabel(personal.learning.coins)}.</p>
          <button class="primary-button" data-editor-action="simulation" data-value="${id}">Abrir simulador</button></div>`);
        render();
        return;
      }
      if (kind === 'lesson') {
        const item = findActivity(id);
        if (Number(values.answer) !== item.answer) {
          feedback.textContent = 'Prueba otra respuesta.';
          return;
        }
        let earned;
        updatePersonal(({ learning }) => { earned = completeChallenge(learning, item); });
        feedback.textContent = (earned ? '+' + coinLabel(earned) + '. ' : 'Respuesta correcta. ') + item.example;
        render();
        return;
      }
      let movementMonth;
      updatePersonal(data => {
        switch (kind) {
          case 'account': saveAccount(data, values, id); break;
          case 'movement': case 'receipt': movementMonth = addMovement(data, values); break;
          case 'goal': addGoal(data, values, id); break;
          case 'payment': data.payments.push({ id: crypto.randomUUID(), label: nameFrom(values.name), cents: asCents(values.cents), date: requiredDate(values.date), paid: false }); break;
          case 'diagnostic': {
            const score = [lessons[0], lessons[2], lessons[3]].filter((item, index) => item.answer === Number(values['q' + index])).length;
            data.learning.level = levels[Math.max(0, score - 1)];
            break;
          }
        }
      });
      if (movementMonth || kind === 'account') state.month = movementMonth ?? newestMonth();
      if (movementMonth) {
        state.opened = false;
        state.spendingCategory = null;
        state.filter = { account: '', kind: '', search: '', category: '', date: '' };
        state.organize = 'historial';
      }
      if (kind === 'payment') { state.calendarMonth = values.date.slice(0, 7); state.calendarDay = ''; }
      editor.close();
      render();
      main.focus({ preventScroll: true });
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  editor.addEventListener('input', event => {
    const form = event.target.form;
    if (form?.dataset.form === 'simulation') updateSimulation(form);
  });
  editor.addEventListener('change', async event => {
    const { name, value, form } = event.target;
    if (name === 'kind') {
      form.querySelector('[data-category-field]').hidden = value !== 'expense';
      form.querySelector('[data-destination-field]').hidden = value !== 'transfer';
    }
    if (name !== 'receipt' || !event.target.files[0]) return;
    const input = event.target;
    const file = input.files[0];
    const status = form.querySelector('#receipt-status');
    status.textContent = 'Leyendo la boleta…';
    let worker;
    try {
      const { default: Tesseract } = await import('https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.esm.min.js');
      worker = await Tesseract.createWorker('spa');
      const { data } = await worker.recognize(file);
      if (!form.isConnected || input.files[0] !== file || !editor.open) return;
      const lines = data.text.split('\n').map(line => line.trim()).filter(Boolean);
      const total = lines.filter(line => /\btotal\b/i.test(line) && !/subtotal|igv|descuento/i.test(line))
        .map(line => line.match(/(\d+(?:[.,]\d{3})*[.,]\d{2})\s*$/)?.[1]).filter(Boolean).at(-1);
      if (total) form.elements.cents.value = total.slice(0, -3).replace(/[.,]/g, '') + '.' + total.slice(-2);
      if (lines[0] && !form.elements.name.value) form.elements.name.value = lines[0].slice(0, 72);
      const date = data.text.match(/\b(\d{2})[/-](\d{2})[/-](20\d{2})\b/);
      if (date) form.elements.date.value = `${date[3]}-${date[2]}-${date[1]}`;
      status.textContent = total ? 'Revisa el monto y la fecha antes de guardar.' : 'Completa el monto manualmente.';
    } catch {
      if (form.isConnected && input.files[0] === file) status.textContent = 'No se pudo leer la imagen. Puedes completar los campos.';
    } finally {
      await worker?.terminate();
    }
  });
  editor.addEventListener('click', event => {
    if (event.target === editor) { editor.close(); return; }
    const control = event.target.closest('[data-editor-action]');
    if (!control) return;
    const { editorAction, value } = control.dataset;
    if (editorAction === 'quiz') openQuiz(value);
    if (editorAction === 'course') openLesson(value);
    if (editorAction === 'simulation') openSimulation(value);
    if (editorAction === 'retos') {
      editor.close();
      state.explore = 'retos';
      render({ focus: '[data-action="explore"][data-value="retos"]' });
    }
  });

  return { organizeTabs, exploreTabs, savingsPanel, upcomingPanel, calendarView, goalsView, learningView, assistantView, handleAction };
}
