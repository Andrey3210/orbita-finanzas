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
