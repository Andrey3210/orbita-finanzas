export const lessons = [
  { id: 'presupuesto', title: 'Tu primer presupuesto', route: 'Ordena tu mes', level: 0, icon: 'wallet',
    reading: 'Anota lo que ingresa y separa primero los gastos que no puedes posponer. El resto se puede repartir entre ahorro y gastos flexibles.',
    example: 'Con S/ 1,000 de ingresos y S/ 700 en gastos necesarios, te quedan S/ 300 para repartir.',
    question: 'Te quedan S/ 300 después de cubrir lo esencial. ¿Cuál es un buen siguiente paso?',
    options: ['Gastar todo de inmediato', 'Separar un monto para ahorro', 'Contar el crédito como ingreso'], answer: 1 },
  { id: 'ahorro', title: 'Ahorra para una meta', route: 'Ordena tu mes', level: 0, icon: 'target',
    reading: 'Una meta tiene un monto y una fecha. Divide el dinero que te falta entre los meses que quedan para saber cuánto separar cada mes.',
    example: 'Para juntar S/ 600 en seis meses, partiendo de cero, separa S/ 100 cada mes.',
    question: 'Te faltan S/ 480 y tienes cuatro meses. ¿Cuánto debes guardar cada mes?',
    options: ['S/ 120', 'S/ 80', 'S/ 160'], answer: 0 },
  { id: 'credito', title: 'El costo del crédito', route: 'Entiende el crédito', level: 1, icon: 'card',
    reading: 'Para comparar ofertas de crédito, revisa el costo total, incluidas comisiones y seguros, además de la cuota y el plazo.',
    example: 'Si recibes S/ 1,000 y devuelves S/ 1,150 en total, el costo de financiarte es S/ 150.',
    question: '¿Qué dato te ayuda a comparar dos créditos del mismo monto?',
    options: ['El color de la tarjeta', 'El monto total que devuelves', 'Solo el tamaño de la primera cuota'], answer: 1 },
  { id: 'interes', title: 'Interés compuesto', route: 'Haz crecer tu dinero', level: 2, icon: 'trend',
    reading: 'El interés compuesto se calcula sobre el capital y los intereses acumulados. Compara siempre tasas del mismo periodo.',
    example: 'S/ 1,000 al 10% anual crecen a S/ 1,100 en un año y S/ 1,210 en dos años si reinviertes el interés.',
    question: '¿Cuánto interés ganas en el segundo año del ejemplo?',
    options: ['S/ 100', 'S/ 210', 'S/ 110'], answer: 2 },
];

const extraQuestions = {
  presupuesto: [
    { question: 'Ingresan S/ 700 y separas S/ 480 para gastos necesarios. ¿Cuánto queda?', options: ['S/ 180', 'S/ 220', 'S/ 280'], answer: 1 },
    { question: '¿Dónde registrarías la recarga de tu tarjeta del Metropolitano?', options: ['Transporte', 'Ingreso', 'Ahorro'], answer: 0 },
  ],
  ahorro: [
    { question: 'Tu meta cuesta S/ 350 y ya tienes S/ 110. ¿Cuánto te falta?', options: ['S/ 460', 'S/ 110', 'S/ 240'], answer: 2 },
    { question: '¿Cuál de estas metas puedes medir y planificar?', options: ['Ahorrar S/ 30 al mes durante seis meses', 'Guardar algo algún día', 'Comprar más cosas'], answer: 0 },
  ],
  credito: [
    { question: 'Te prestan S/ 500 y devuelves S/ 560 en total. ¿Cuánto cuesta el crédito?', options: ['S/ 60', 'S/ 500', 'S/ 1,060'], answer: 0 },
    { question: 'Dos créditos te entregan el mismo monto. ¿Qué cargo debes incluir para compararlos?', options: ['Solo la cuota inicial', 'Comisiones y seguros obligatorios', 'Solo los intereses del primer mes'], answer: 1 },
  ],
  interes: [
    { question: 'Si ahorras S/ 200 al 5% anual, ¿cuál es el saldo tras el primer año?', options: ['S/ 205', 'S/ 210', 'S/ 220'], answer: 1 },
    { question: '¿Sobre qué monto se calcula el interés compuesto del segundo año?', options: ['Solo sobre el capital inicial', 'Sobre el capital y el interés acumulado', 'Solo sobre el interés del primer año'], answer: 1 },
  ],
};
export const quizFor = course => [course, ...extraQuestions[course.id]];
export const passingScore = 2;
export const courseCoins = 20;

export const milestones = [
  { id: 'primer-curso', title: 'Primer paso', description: 'Aprueba 1 curso', target: 1, coins: 5, progress: learning => lessons.filter(course => learning.completed.includes(course.id)).length },
  { id: 'tres-cursos', title: 'En racha', description: 'Aprueba 3 cursos', target: 3, coins: 15, progress: learning => lessons.filter(course => learning.completed.includes(course.id)).length },
  { id: 'quiz-perfecto', title: 'Puntaje perfecto', description: 'Consigue 3 de 3 en un quiz', target: 3, coins: 10, progress: learning => Math.max(0, ...Object.values(learning.quizScores)) },
];

export const challenges = [
  { id: 'necesidades', title: 'Reto · Primero lo necesario', question: 'Tienes S/ 60 hasta fin de semana. ¿Qué pago conviene apartar primero?',
    options: ['S/ 20 de pasajes a clases', 'S/ 55 para una salida', 'S/ 50 para un juego'], answer: 0,
    example: 'Separa los pasajes primero. Los S/ 40 restantes te dan margen para el resto de la semana.' },
  { id: 'imprevisto', title: 'Reto · Un gasto inesperado', question: 'Debes reparar tu bicicleta por S/ 80 y tenías S/ 100 para ocio. ¿Cómo ajustas el presupuesto?',
    options: ['Ignorar el costo', 'Reducir ocio a S/ 20', 'Anotar S/ 80 como ingreso'], answer: 1,
    example: 'Pasar S/ 80 de ocio a la reparación mantiene tu presupuesto dentro de S/ 100.' },
];

export const rewards = [
  { id: 'constancia', label: 'Insignia Constancia', icon: 'spark', cost: 20 },
  { id: 'brujula', label: 'Insignia Brújula', icon: 'compass', cost: 30 },
];

export const news = [
  { title: 'Precios al consumidor en Perú', source: 'INEI · Octubre 2026', url: 'https://www.inei.gob.pe/media/principales_indicadores/informe-de-precios-octubre2026.pdf',
    impact: 'Si suben alimentos y transporte, revisa cuánto cambió tu gasto en esos rubros antes de ajustar tu presupuesto mensual.' },
  { title: 'Perspectivas de la economía mundial', source: 'FMI · Octubre 2026', url: 'https://www.imf.org/en/publications/weo/issues/2026/10/13/world-economic-outlook-october-2026',
    impact: 'El costo de la energía y los bienes importados puede afectar precios en Perú. Su efecto en tu bolsillo depende de cuánto consumas de esos rubros.' },
];

export const simulations = {
  tarjeta: { label: 'Tarjeta de crédito', result: 'Total con interés', fields: [['Consumo (S/)', 500], ['Tasa mensual (%)', 4], ['Meses', 3]], calc: (a, b, c) => a * (1 + b / 100) ** c, note: 'Saldo sin abonos ni comisiones.' },
  prestamo: { label: 'Préstamo', result: 'Cuota mensual', fields: [['Monto (S/)', 1000], ['Tasa mensual (%)', 2], ['Cuotas', 6]], calc: (a, b, c) => b ? a * (b / 100) / (1 - (1 + b / 100) ** -c) : a / c, note: 'Cuotas iguales, sin seguros ni comisiones.' },
  presupuesto: { label: 'Presupuesto', result: 'Saldo del mes', fields: [['Ingresos (S/)', 1500], ['Gastos (S/)', 1000], ['Ahorro (S/)', 150]], calc: (a, b, c) => a - b - c },
  impuestos: { label: 'Impuestos', result: 'Impuesto estimado', fields: [['Base imponible (S/)', 1000], ['Tasa elegida (%)', 10]], calc: (a, b) => a * b / 100, note: 'Ejercicio de tasa plana. Introduce la tasa del escenario.' },
  inversiones: { label: 'Inversiones', result: 'Capital al final', fields: [['Capital (S/)', 1000], ['Tasa anual (%)', 5], ['Años', 3]], calc: (a, b, c) => a * (1 + b / 100) ** c, note: 'Capitalización anual, sin comisiones.' },
  negocio: { label: 'Emprendimiento', result: 'Margen estimado', fields: [['Precio por unidad (S/)', 20], ['Costo por unidad (S/)', 12], ['Unidades', 50]], calc: (a, b, c) => (a - b) * c, note: 'Antes de costos fijos.' },
};

export const simulationRequirements = {
  tarjeta: { course: 'credito', cost: 15 },
  prestamo: { course: 'credito', cost: 20 },
  presupuesto: { course: 'presupuesto', cost: 10 },
  impuestos: { course: 'presupuesto', cost: 15 },
  inversiones: { course: 'interes', cost: 25 },
  negocio: { course: 'ahorro', cost: 15 },
};

export function restoreLearning(learning) {
  learning.quizScores ??= {};
  learning.unlocked ??= [];
  learning.milestones ??= milestones.filter(item => item.progress(learning) >= item.target).map(item => item.id);
  learning.history ??= learning.coins > 0 ? [{ label: 'Saldo anterior', change: learning.coins }] : [];
}

function moveCoins(learning, label, change) {
  learning.coins += change;
  learning.history.push({ label, change });
}

export function gradeCourse(learning, course, answers) {
  const quiz = quizFor(course);
  const score = quiz.filter((item, index) => answers[index] === item.answer).length;
  const passed = score >= passingScore;
  const previousBalance = learning.coins;
  learning.quizScores[course.id] = Math.max(learning.quizScores[course.id] ?? 0, score);
  if (passed && !learning.completed.includes(course.id)) {
    learning.completed.push(course.id);
    moveCoins(learning, course.title, courseCoins);
  }
  for (const item of milestones) {
    if (learning.milestones.includes(item.id) || item.progress(learning) < item.target) continue;
    learning.milestones.push(item.id);
    moveCoins(learning, item.title, item.coins);
  }
  return { score, passed, total: quiz.length, earned: learning.coins - previousBalance };
}

export function completeChallenge(learning, item) {
  if (learning.completed.includes(item.id)) return 0;
  learning.completed.push(item.id);
  moveCoins(learning, item.title, 10);
  return 10;
}

export function simulationStatus(learning, id) {
  const { course, cost } = simulationRequirements[id];
  if (learning.unlocked.includes(id)) return 'unlocked';
  if (!learning.completed.includes(course)) return 'course';
  if (learning.coins < cost) return 'coins';
  return 'available';
}

export function redeemSimulation(learning, id) {
  if (simulationStatus(learning, id) !== 'available') return false;
  learning.unlocked.push(id);
  moveCoins(learning, simulations[id].label, -simulationRequirements[id].cost);
  return true;
}

export function redeemBadge(learning, reward) {
  if (learning.badges.includes(reward.id) || learning.coins < reward.cost) return false;
  learning.badges.push(reward.id);
  moveCoins(learning, reward.label, -reward.cost);
  return true;
}
