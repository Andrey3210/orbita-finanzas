# Órbita · Observatorio financiero

Prototipo web en español para explorar cuentas, gastos, ingresos y transferencias ficticias en soles. Incluye datos de septiembre y octubre de 2026 y un escenario independiente para noviembre. No necesita un servidor de aplicaciones ni credenciales.

## Cómo probarlo

1. En **Inicio**, toca la columna o la etiqueta del **15 de octubre**. El pico suma **S/ 1,480.00**.
2. Abre **Hogar** y selecciona **Alquiler · Miraflores** para ver el movimiento de **S/ 1,150.00**.
3. Cierra el detalle y toca **Comparar este día**. Octubre supera a septiembre por **S/ 951.00** ese día. **Hogar** aporta **S/ 840.00** a la diferencia.
4. En **Simular**, arrastra el marcador de **Cobro · Proyecto Atlas** del día 4 al 7, o usa **Retrasar un día** tres veces. El primer faltante es **S/ 340.00 el 6 de noviembre**. Usa **Restablecer** para volver al plan original.

En **Explorar → Flujo de dinero**, elige una ruta desde el diagrama o desde el selector para ver su total y sus movimientos. En **Cuentas**, las transferencias propias salen de una cuenta y entran en otra; no se cuentan como ingreso ni gasto. En **Actividad**, puedes combinar mes, cuenta, tipo y búsqueda.

## Desarrollo

- `npm run dev`: abre el sitio local en `http://127.0.0.1:4176/`.
- `npm test`: verifica saldos, transferencias, el pico, la comparación y el faltante.
- Para repetir la prueba de navegador: instala Playwright con `npm install --no-save --package-lock=false playwright`, ejecuta `npx playwright install chromium`, inicia el servidor y ejecuta `node tests/browser.mjs`.

GitHub Pages publica la raíz de `main`. La app usa rutas relativas para los archivos y fragmentos para navegar entre secciones. Las cifras se calculan en céntimos enteros. Las interacciones tienen controles de teclado y respetan la preferencia de movimiento reducido.
