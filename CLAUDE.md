# CLAUDE.md — Mi Plan

Guía maestra para cualquier sesión de Claude Code en este proyecto. Léela antes de
escribir código. Si algo aquí contradice el código real, gana el código: avísalo y
actualiza este archivo.

---

## 1. Qué es

**Mi Plan** es una PWA mobile-first de finanzas personales en español. Su objetivo
único: ayudar a una persona endeudada a salir de sus deudas con la estrategia
**bola de nieve / avalancha híbrida** (atacar las deudas en un orden fijo definido
por `orden_ataque`, pagando la cuota mínima de todas y un extra sobre la "objetivo
actual").

Es una app personal, de un solo usuario por cuenta. No es un SaaS multi-tenant
complejo: la simplicidad es una característica, no una limitación.

**Prototipo de referencia:** [MiPlan_Supabase.html](MiPlan_Supabase.html) es un
prototipo HTML monolítico 100% funcional. Es la **fuente de verdad** para el diseño
visual, los textos en español, la lógica de finanzas y el flujo de UX. Cuando dudes
de cómo debe verse o comportarse algo, ábrelo y cópialo. La versión React debe
sentirse idéntica al usuario.

---

## 2. Stack

| Capa | Tecnología | Nota |
|------|-----------|------|
| Build | Vite | |
| UI | React + TypeScript | |
| Estilos | Tailwind CSS | Los tokens de color del prototipo van en el tema (ver §6) |
| Backend/DB | Supabase (PostgreSQL + Auth) | RLS **siempre activo** |
| Persistencia local | localStorage | Clave `miplan_v1` en el prototipo |
| PWA | manifest + service worker | Instalable, offline |
| Gráficos | Canvas (donut hecho a mano en el prototipo) | No metas Chart.js si un canvas de 120px basta |

**No añadas dependencias sin razón.** El prototipo entero corre con cero
dependencias salvo `@supabase/supabase-js`. Mantén esa disciplina.

---

## 3. Arquitectura híbrida (lo más importante de entender)

El patrón es **local-first con sincronización en segundo plano**:

1. **Toda escritura se guarda primero en localStorage** y la UI se actualiza al
   instante. La app funciona completa sin internet ni Supabase.
2. **Si hay nube conectada**, la misma escritura se sube a Supabase en segundo
   plano (`subirMovimiento`, `subirInteresesNube`, etc.).
3. **Al arrancar**, si hay sesión, se baja el estado de la nube y reemplaza al
   local (`bajarDeNube`).
4. Si faltan credenciales de Supabase, la app degrada con gracia a modo solo-local.
   Nunca debe romperse por falta de nube.

Un indicador visual (`☁ Sincronizado` / `📱 Solo en este equipo`) refleja el estado.

Detalle completo en [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 4. Modelo de datos

Tipos canónicos (la versión React debe tipar esto en `src/types/index.ts`):

```ts
type TipoDeuda = 'tarjeta' | 'credito'
type TipoMovimiento = 'gasto' | 'ingreso' | 'abono'

interface Deuda {
  id: string
  nombre: string
  tipo: TipoDeuda
  saldoInicial: number   // saldo_inicial — no cambia, base para el % pagado
  saldo: number          // saldo_actual — baja con abonos, sube con intereses
  cuota: number          // cuota_mensual
  tasaEA: number         // tasa efectiva anual, ej. 24.33 (porcentaje, no fracción)
  orden: number          // orden_ataque, 1 = se ataca primero
}

interface Movimiento {
  id: number | string    // Date.now() local; uuid en nube
  tipo: TipoMovimiento
  monto: number
  desc?: string
  cat?: string           // solo gastos; id de CATEGORIAS
  deudaId?: string       // solo abonos
  fecha: string          // 'YYYY-MM-DD'
}

interface Config {
  ingresoMensual: number
  presupuestoOcio: number
}
```

Tablas Supabase (snake_case): `deudas`, `movimientos`, `intereses_aplicados`,
`config`. Esquema completo y autoritativo en [supabase_schema.sql](supabase_schema.sql)
(es el SQL real que corre en Supabase). El mapeo camelCase↔snake_case se hace en la
capa de sync (ver el prototipo, líneas ~741-750).

Detalles del esquema real que la capa de sync debe respetar:
- **Nombres de timestamp distintos por tabla:** `deudas.creada_en`/`actualizada_en`,
  `movimientos.creado_en`, `intereses_aplicados.aplicado_en`, `config.actualizada_en`.
- **`config` no tiene `id`:** su PK es `user_id` (una fila por usuario → usa `upsert`
  sobre `user_id`).
- **`intereses_aplicados` es de solo inserción** (tiene policies de select/insert/delete,
  no de update). El `unique(user_id, mes)` impone el anti-duplicado a nivel de DB.
- **Trigger:** al hacer `update` en `deudas`, `actualizada_en` se refresca solo.
- **RPC atómico para abonos** (preferir sobre insert+update manuales):
  ```ts
  await supabase.rpc('registrar_abono', { p_deuda: deudaId, p_monto: monto })
  ```
  Inserta el movimiento de abono y descuenta `saldo_actual` (sin bajar de 0) y ajusta
  `activa` en una sola transacción. Tras llamarlo, re-bajar o actualizar el saldo local.

---

## 5. Lógica de finanzas (no la reinventes — está en el prototipo)

### Intereses mensuales
Cada deuda tiene tasa **efectiva anual**. Para el interés del mes:

```ts
const tasaMensual = Math.pow(1 + tasaEA / 100, 1 / 12) - 1
const interes = saldo * tasaMensual
saldo += interes
```

**Control anti-duplicado:** los intereses se aplican **una sola vez por mes**. Se
guarda el mes (`'YYYY-MM'`) en `interesesAplicados`/tabla `intereses_aplicados`.
Antes de aplicar, verifica si el mes ya está. El botón cambia de estado ("Aplicar
intereses de junio" → "✓ Intereses de junio ya aplicados"). Requiere confirmación
del usuario.

### Objetivo actual (bola de nieve)
La deuda objetivo es **la deuda viva (saldo > 1) con menor `orden`**:
```ts
const objetivo = deudas.filter(d => d.saldo > 1).sort((a,b) => a.orden - b.orden)[0]
```

### Stats del mes
`movsDelMes` = movimientos cuya `fecha` empieza con `YYYY-MM` actual.
- Pagado = suma de abonos; Gastado = suma de gastos; Ingresado = suma de ingresos.
- Disponible = ingresos − gastos − abonos.

### % pagado
Deuda: `(1 − saldo/saldoInicial) * 100`, mínimo 0, "pagada" si `saldo <= 1`.
Total: `(1 − totalActual/DEUDA_INICIAL_TOTAL) * 100`.

### Gastos hormiga
Gastos en categorías `['comida','gaming','suscrip','otros']`. Se muestra alerta si
hay total > 0 **y** al menos 2 transacciones de esas categorías en el mes.

---

## 6. Las secciones (navegación inferior)

> Nota: además de las 4 originales hay **Perfil** y **Ahorro** (bolsillos + préstamos).
> El detalle original de las 4 sigue abajo.


1. **Inicio** (`Inicio.tsx`): hero con deuda total restante + barra de progreso,
   4 mini-stats del mes, tarjeta "Próximo objetivo" con botón de abono.
2. **Deudas** (`Deudas.tsx`): lista ordenada por `orden`, la objetivo destacada con
   borde verde y badge "⚡ OBJETIVO ACTUAL", botón de abono por deuda, y el botón
   global "Aplicar intereses del mes".
3. **Gastos** (`Gastos.tsx`): alerta de gastos hormiga, donut por categoría +
   leyenda, lista de movimientos recientes.
4. **Plan** (`Plan.tsx`): plan mes a mes (14 meses), qué deuda atacar cada mes y
   cuándo se liquida cada una.

El FAB (+) abre el modal de registro (gasto/ingreso/abono).

---

## 7. Diseño visual

Tokens de color (cópialos al tema de Tailwind, ya están en el `:root` del prototipo):

```
--verde-prof: #0F2A24   --verde-medio: #1D6E56   --verde-vivo: #1D9E75
--verde-claro: #E1F5EE  --crema: #F7F5EF         --carbon: #1A1E1C
--gris: #6B7270         --rojo: #E24B4A          --ambar: #BA7517   --azul: #378ADD
```

Mobile-first, ancho máximo 480px centrado. Bordes redondeados generosos (16-22px),
sombras suaves. Respeta `env(safe-area-inset-*)` para notch/home-bar. Tipografía
del sistema. Tono de los textos: cálido, motivador, en español de Colombia (montos
con `toLocaleString('es-CO')`, prefijo `$`).

---

## 8. Seguridad (no negociable)

- Credenciales de Supabase **solo** en `.env` vía `import.meta.env.VITE_SUPABASE_URL`
  y `VITE_SUPABASE_ANON_KEY`. Nunca hardcodeadas. Ver el patrón en [.env.example](.env.example).
- El `.env` real **siempre** en `.gitignore`. Verifícalo antes de cualquier commit/push.
- Solo la **publishable/anon key** va al frontend. La **secret key JAMÁS**.
- **RLS está activo** en el esquema. No lo desactives. Toda fila se filtra por `user_id`.
- En Vercel, las credenciales van en "Environment Variables", no en el código.
- Si una llave se expone por accidente, hay que rotarla.

---

## 9. Fases de construcción

Construye por fases y **prueba cada una antes de seguir**:

1. **Estructura** — scaffold Vite+React+TS, Tailwind con tokens, tipos de `src/types`.
2. **Supabase + sync** — cliente, sesión, capa híbrida local↔nube.
3. **Lógica de finanzas** — `src/lib/finanzas.ts`: intereses, bola de nieve, plan.
4. **UI** — las 4 vistas, una por una, calcando el prototipo.
5. **PWA + pulido** — manifest, service worker, instalable, detalles visuales.

Estado actual del proyecto y decisiones tomadas: ver §"Estado" abajo, manténlo al día.

---

## 10. Convenciones de código

- TypeScript estricto. Tipa el modelo de datos; evita `any`.
- Componentes funcionales + hooks. Lógica de datos en hooks (`useDeudas`,
  `useMovimientos`, `useSync`), no en las vistas.
- Lógica de finanzas **pura y testeable** en `src/lib/finanzas.ts`, sin React.
- Nombres y textos de UI en español (como el prototipo). Nombres de código en
  inglés o español, pero consistentes con lo que ya exista.
- No dupliques la lógica de cálculo entre local y nube: una sola implementación.

---

## 11. Estado del proyecto (mantener al día)

> Actualiza esta sección al final de cada sesión.

- **2026-06-13 (1)** — Documentación inicial (CLAUDE.md, AGENT.md, skill,
  ARCHITECTURE.md, esquema SQL real, .env.example, .gitignore).
- **2026-06-13 (2) — Fase 1 COMPLETA y validada.** Scaffold Vite+React+TS+Tailwind
  funcionando. Creado: `package.json`, `vite.config.ts`, `tsconfig.json`,
  `tailwind.config.js` (con los tokens), `postcss.config.js`, `index.html`,
  `src/main.tsx`, `src/index.css`, `src/App.tsx` (shell de validación),
  `src/types/index.ts`, `src/lib/constantes.ts` (DEUDAS_INIT, CATEGORIAS),
  `src/lib/supabase.ts`, `src/vite-env.d.ts`.
  - Validado: `npm run build` y `npm run typecheck` pasan; dev server sirve 200;
    conexión real a Supabase OK (4 tablas alcanzables, RLS devuelve 0 filas sin
    sesión = correcto, RPC `registrar_abono` existe).
  - Nota TS: se usa **un solo tsconfig** con `tsc --noEmit` (no project references,
    que chocaban con `noEmit`). No reintroducir `tsconfig.node.json` con references.
- **2026-06-13 (3) — Fases 2, 3, 4 y 5 COMPLETAS y validadas. App funcional end-to-end.**
  - **Fase 3 (lógica pura):** `src/lib/finanzas.ts` (intereses, bola de nieve, stats,
    gastos hormiga, `generarPlan` por simulación), `src/lib/format.ts`,
    `src/lib/fechas.ts`. Cubierta por `src/lib/finanzas.test.ts` (20 tests).
  - **Fase 2 (estado + sync + auth):** `src/store/local.ts` (localStorage),
    `src/lib/sync.ts` (auth email/OTP, bajar/subir, RPC `registrar_abono`),
    `src/store/AppContext.tsx` (estado central + acciones + toast, patrón local-first).
  - **Fase 4 (UI):** vistas `Inicio/Deudas/Gastos/Plan` + componentes `NavBar`,
    `DeudaCard`, `MovimientoItem`, `DonutChart` (canvas), `ModalRegistro`,
    `EstadoNube` (badge + login), `InstallBanner`. `App.tsx` = router por estado + FAB.
  - **Fase 5 (PWA):** `public/manifest.webmanifest`, `public/sw.js` (network-first),
    `public/icon.svg`; SW registrado en `main.tsx` solo en producción.
  - **Validado:** `npm run typecheck` OK · `npm test` 24/24 (incluye smoke test de
    render con jsdom) · `npm run build` OK (91 módulos) · dev server sirve 200 ·
    Supabase: 4 tablas + RPC alcanzables, RLS correcto.
  - **Notas:** Vitest carga el `.env`; se anula en `vite.config.ts` (`test.env`) para
    que los tests corran en modo solo-local determinista. El plan se **calcula** por
    simulación (`generarPlan`), no es tabla fija.
  - Iconos PNG (hoy se usa SVG, válido en Chromium) si se quiere soporte iOS completo.
- **2026-06-13 (4) — Auth cambiada a email + contraseña + registro.**
  - `AuthScreen.tsx`: pantalla de login/registro (tabs Iniciar sesión / Crear cuenta),
    con opción "usar sin cuenta". Se muestra al arrancar si hay nube y no hay sesión.
  - `lib/sync.ts`: `entrar` (signInWithPassword), `registrarUsuario` (signUp),
    `subirDeudasIniciales` + `sincronizarBajada` (auto-seed si la cuenta está vacía).
  - `AppContext`: API `entrar/registrar/salirNube/abrirAuth/cerrarAuth`; renderiza
    `AuthScreen` como overlay. (OTP eliminado.)
  - **Auto-seed:** una cuenta nueva siembra sus 9 deudas en la nube automáticamente, así
    no depende del `user_id` fijo del seed SQL. Resuelve el problema de "edito la DB y no
    se ve": cada usuario ve y sincroniza SUS filas (RLS).
  - Validado: typecheck OK, 24/24 tests, build OK (92 módulos), dev server 200.
  - **Config Supabase:** Authentication → Providers → Email habilitado. "Confirm email"
    ON = el registro pide confirmar correo antes de entrar; OFF = entra al instante.
  - **Pendiente real:** probar entrar/registrar end-to-end (necesita un correo/contraseña
    real del usuario). El código compila y la conexión está verificada.
- **2026-06-13 (5) — Diseño responsive en login + dashboard + todas las vistas.**
  - Estrategia de 3 niveles: **móvil (`<md`)** conserva la esencia app (columna única,
    barra inferior, FAB); **tablet (`md`)** ensancha contenido y usa grids 2-col + stats
    de 4; **desktop (`lg`)** usa `Sidebar` lateral (oculta la barra inferior y el FAB) y
    dashboards multi-columna con contenido centrado en `lg:max-w-5xl`.
  - `Sidebar.tsx` nuevo (nav desktop). `NavBar.tsx` ahora `lg:hidden`. `App.tsx` shell
    con `lg:flex` + sidebar. `AuthScreen` ya era split-screen.
  - Vistas: Inicio (2-col en lg), Deudas (grid 1→2→3), Gastos (2-col en lg), Plan
    (grid 1→2→3). `ModalRegistro` = bottom-sheet en móvil, diálogo centrado en lg.
  - Nota tests: Sidebar y NavBar coexisten en el DOM (CSS oculta uno), así que los
    labels de nav salen 2×; el smoke test usa `getAllByText(...)[0]`.
  - Validado: typecheck OK, 24/24 tests, build OK.
- **2026-06-13 (6) — Vista de Perfil + se quitó el badge de "Sincronizado".**
  - Nueva 5ª sección **Perfil** (👤) en NavBar (móvil/tablet) y como chip de cuenta al
    pie del `Sidebar` (desktop). `views/Perfil.tsx`: avatar (subir/quitar imagen), nombre,
    teléfono, correo, cambiar contraseña y **logout** (el logout vive aquí ahora).
  - `EstadoNube.tsx` **eliminado**; el badge de nube ya no existe (el tipo `EstadoNube`
    en AppContext sigue, es otra cosa). El login se accede desde Perfil o el chip del
    Sidebar; AuthScreen sigue auto-apareciendo al arrancar sin sesión.
  - `components/Avatar.tsx` (imagen o inicial). `lib/imagen.ts` (redimensiona a 256px,
    JPEG dataURL). `store/perfil.ts` (perfil en localStorage, clave `miplan_perfil`).
  - `lib/sync.ts`: `actualizarDatosUsuario` (nombre/teléfono → user_metadata),
    `actualizarEmail`, `actualizarPassword`, `metadatosUsuario`. AppContext: estado
    `perfil` + `actualizarPerfil/cambiarEmail/cambiarPassword`; al iniciar sesión fusiona
    nombre/teléfono desde user_metadata.
  - **Avatar es local (localStorage), no sincroniza entre dispositivos.** Para eso haría
    falta Supabase Storage (bucket `avatars`) — pendiente si se quiere. Nombre/teléfono sí
    sincronizan vía user_metadata; email/password vía supabase.auth.updateUser.
  - Validado: typecheck OK, 25/25 tests, build OK, dev server 200.
- **2026-06-13 (7) — Perfil conectado a Supabase (tabla `perfiles` + Storage `avatars`).**
  - SQL aplicado por el usuario: [supabase_perfiles.sql](supabase_perfiles.sql) crea la
    tabla `perfiles` (user_id PK, nombre, telefono, avatar_url, RLS) y el bucket público
    `avatars` (subir/editar/borrar solo el dueño en carpeta `{user_id}/`). Verificado
    contra Supabase: tabla OK, bucket OK (nota: `getBucket` con anon da "not found" —
    falso negativo; usar `from('avatars').list()` para verificar).
  - `lib/sync.ts`: se quitó el guardado en user_metadata. Nuevas funciones `bajarPerfil`,
    `guardarPerfilNube` (upsert), `subirAvatarNube` (sube a `{uid}/avatar.jpg`, devuelve
    URL pública con `?v=timestamp` anti-caché), `borrarAvatarNube`.
  - `lib/imagen.ts`: `procesarImagen` ahora devuelve `{ dataUrl, blob }` (blob para Storage).
  - `AppContext`: `actualizarPerfil` (nombre/telefono → tabla perfiles), `actualizarAvatar`
    (sube a Storage si hay sesión; si no, dataURL local), `quitarAvatar`. Al entrar,
    `cargarPerfilNube` baja de `perfiles` y, si no hay fila, la siembra desde lo local.
  - **Avatar ahora SÍ sincroniza** entre dispositivos (vive en Storage). En modo
    solo-local sigue como dataURL en localStorage.
  - Validado: typecheck OK, 25/25 tests, build OK.
- **2026-06-14 — Fase 6 (mejoras 1-4) COMPLETA.** Roadmap en `docs/ROADMAP.md`.
  - **IDs uuid de cliente** (`lib/id.ts` `nuevoId()`): deudas y movimientos nuevos usan
    el MISMO id en local y nube → editar/borrar fiable. Se **dejó de usar el RPC
    `registrar_abono`**; el abono ahora es insert + update de saldo (ids explícitos).
  - **1. Editar/borrar movimientos:** `editarMovimiento`/`eliminarMovimiento` en
    AppContext (revierte saldo al tocar abonos). UI: tocar un movimiento en Gastos abre
    `ModalRegistro` en modo edición (con botón Eliminar). Orden por `fecha` desc.
  - **2. Deudas CRUD:** `agregarDeuda`/`editarDeuda`/`eliminarDeuda` + `ModalDeuda`.
    DeudaCard tiene botón ✏️; Deudas tiene "+ Agregar deuda" y estado vacío. Sync:
    `insertarDeudaNube`/`actualizarDeudaNube`/`eliminarDeudaNube`.
  - **3. Confirmaciones:** `ConfirmDialog` + `pedirConfirmacion(opts): Promise<bool>` en
    AppContext (usado en aplicar intereses, borrar movimiento/deuda).
  - **4. Onboarding:** `estadoInicial()` ahora **vacío** (sin deudas de ejemplo).
    `Onboarding.tsx` (bienvenida → ingreso → elegir: agregar deudas / ejemplo / vacío).
    Flag `miplan_onboarded` en localStorage; se marca onboarded al bajar deudas de la
    nube. `% pagado total` ahora usa `deudaInicialTotal(deudas)` (no la constante fija).
  - Nota tests: se siembra localStorage (onboarded + DEUDAS_INIT) en `beforeEach` para
    que el dashboard renderice; hay test del onboarding.
  - Validado: typecheck OK, 26/26 tests, build OK (100 módulos), dev server 200.
  - Commit inicial del repo: `f4fbf62` (master). `.env` excluido.
- **Decisiones tomadas:**
  - **Auth = email/OTP** (no anónimo). Un solo dueño; el seed del SQL es de su UID. Ver
    ARCHITECTURE.md §4.
  - El esquema SQL real ([supabase_schema.sql](supabase_schema.sql)) incluye un seed
    **activo** (no comentado) con las 9 deudas + config. ⚠️ Correrlo **una sola vez**:
    `deudas` no tiene unique, así que re-correrlo duplica deudas.
- **Pendientes de decidir:** plan ¿calculado o tabla fija? · tests de `lib/finanzas`.
