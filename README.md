# foxio · Finanzas personales

Prototipo web en español para explorar cuentas, gastos, ingresos y transferencias ficticias en soles. Incluye datos de septiembre y octubre de 2026 y un pronóstico para noviembre calculado a partir de ese historial.

## Cómo probarlo

En Inicio, abre **Ver resumen completo** para consultar los saldos por cuenta, el flujo del mes y el desglose de gastos. En móvil, desliza el dedo por la barra inferior y suéltalo sobre la sección que quieres abrir.

1. En **Inicio**, toca la columna o la etiqueta del **15 de octubre**. El pico suma **S/ 1,480.00**.
2. Abre **Hogar** y selecciona **Alquiler · Miraflores** para ver el movimiento de **S/ 1,150.00**.
3. Cierra el detalle y toca **Comparar este día**. Octubre supera a septiembre por **S/ 951.00** ese día. **Hogar** aporta **S/ 840.00** a la diferencia.
4. En **Pronóstico**, el saldo estimado al cierre de noviembre es **S/ 10,777.75**. El cálculo parte del saldo consolidado de octubre y promedia los ingresos y gastos de ambos meses, con doble peso para octubre. Excluye las transferencias propias y agrupa el día 31 en el último día de noviembre.

En **Explorar → Flujo de dinero**, elige una ruta desde el diagrama o desde el selector para ver su total y sus movimientos. En **Cuentas**, las transferencias propias salen de una cuenta y entran en otra; no se cuentan como ingreso ni gasto. En **Actividad**, puedes combinar mes, cuenta, tipo y búsqueda.

## Instalar en el teléfono

Abre foxio y toca **Instalar**. En iPhone, usa Safari y elige **Compartir → Agregar a pantalla de inicio**. Activa **Abrir como app web** si aparece. En Android, Chrome puede mostrar el aviso de instalación. También puedes abrir el menú de Chrome y elegir **Instalar y crear acceso directo → Instalar**. Abre la app una vez con conexión para que guarde los datos de demostración y las pantallas.

## Desarrollo

- `npm run dev`: abre el sitio local en `http://127.0.0.1:4176/`.
- `npm test`: verifica saldos, transferencias, el pico, la comparación y el pronóstico.
- Para repetir la prueba de navegador: instala Playwright con `npm install --no-save --package-lock=false playwright`, ejecuta `npx playwright install chromium`, inicia el servidor y ejecuta `node tests/browser.mjs`.

GitHub Pages publica la raíz de `main`. La app usa rutas relativas para los archivos y fragmentos para navegar entre secciones. Las cifras se calculan en céntimos enteros. Las interacciones tienen controles de teclado y respetan la preferencia de movimiento reducido.
