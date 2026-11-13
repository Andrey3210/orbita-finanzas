# Miluka · Finanzas personales

Prototipo web en español para organizar tus finanzas, explorar gastos y practicar con retos. Incluye un historial inicial de septiembre y octubre de 2026. Las cuentas, operaciones, pagos, metas y el progreso se guardan en el almacenamiento del navegador.

## Cómo probarlo

- **Inicio.** Toca el pico del 15 de octubre, abre Hogar y consulta el alquiler de S/ 1,150.00. «Comparar» abre el mismo día en septiembre. «Más categorías» y «Resumen completo» amplían el detalle.
- **Organízate.** Agrega o renombra cuentas, registra ingresos, gastos o transferencias y filtra el historial por fecha, cuenta, tipo y motivo. En Calendario puedes programar pagos y marcarlos como realizados. El botón flotante escanea una foto en el navegador y permite revisar los campos antes de guardar. La primera descarga del motor de reconocimiento requiere conexión.
- **Explorar.** Abre rutas, cursos, diagnóstico, retos, recompensas y enlaces de actualidad. «Mis datos» agrupa las gráficas, comparaciones y el flujo de gastos. La demo Plus abre seis calculadoras educativas.
- **Metas.** Registra el objetivo, el monto acumulado y la fecha. Al reservar el ahorro, el saldo disponible disminuye y el saldo total conserva el monto.
- **Asistente.** Consulta el saldo, gastos, ingresos, pagos o metas. El pronóstico se abre al pie del chat y usa los dos últimos periodos con doble peso para el más reciente. Las consultas de texto abiertas y la generación de retos usan la IA local de navegadores compatibles con un modelo disponible. La demo Plus ofrece dictado y lectura en los navegadores que soportan esas funciones.

## Instalar en el teléfono

En iPhone, abre la app en Safari y elige **Compartir → Agregar a pantalla de inicio**. En Android, abre Chrome y elige **Instalar** desde el menú o desde la app. Ábrela una vez con conexión para que pueda cargar sus pantallas sin internet.

## Desarrollo

- `npm run dev` sirve el sitio local en `http://127.0.0.1:4176/`.
- `npm test` verifica los cálculos financieros.
- Para la prueba de navegador, instala Playwright con `npm install --no-save --package-lock=false playwright`, ejecuta `npx playwright install chromium`, inicia el servidor y ejecuta `node tests/browser.mjs`.

GitHub Pages publica la raíz de `main`. Las rutas son relativas y los módulos se abren con fragmentos. Los importes se calculan en céntimos enteros. La aplicación respeta el movimiento reducido y conserva los controles nativos de teclado.
