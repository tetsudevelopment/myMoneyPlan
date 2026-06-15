# Arquitectura — Mi Plan

Diseño técnico de la PWA. Acompaña a [CLAUDE.md](CLAUDE.md) (visión y reglas) y a
[supabase_schema.sql](supabase_schema.sql) (base de datos).

---

## 1. Vista de alto nivel

```
┌─────────────────────────────────────────────────────────┐
│                        UI (React)                        │
│   Inicio · Deudas · Gastos · Plan   +  NavBar / FAB      │
│         (componentes "tontos", calcan el prototipo)      │
└───────────────┬─────────────────────────────────────────┘
                │ usan
┌───────────────▼─────────────────────────────────────────┐
│                       Hooks                              │
│   useDeudas · useMovimientos · useSync                   │
│   (orquestan estado, llaman a lib/ y store/)             │
└───────┬───────────────────────────┬─────────────────────┘
        │                           │
┌───────▼─────────┐        ┌────────▼──────────────────────┐
│  lib/finanzas   │        │   store/local  (localStorage) │
│  (cálculo puro) │        │   fuente primaria, offline    │
└─────────────────┘        └────────┬──────────────────────┘
                                    │ sincroniza (background)
                           ┌────────▼──────────────────────┐
                           │  lib/supabase  →  Supabase     │
                           │  (Postgres + Auth, RLS on)     │
                           └───────────────────────────────┘
```

**Principio rector:** *local-first*. La UI nunca espera a la red. La nube es un
respaldo/sincronizador opcional, no un requisito.

---

## 2. Capas y responsabilidades

### `views/` — pantallas
Las 4 secciones. Reciben datos de los hooks y renderizan. Sin lógica de cálculo ni
acceso directo a Supabase. Calcan el prototipo pixel a pixel.

### `components/` — piezas reutilizables
`NavBar`, `DeudaCard`, `MovimientoItem`, `DonutChart`, `ModalRegistro`, `EstadoNube`.
Presentacionales; reciben props.

### `hooks/` — orquestación de estado
- `useDeudas` — leer/actualizar deudas, aplicar abono, aplicar intereses del mes.
- `useMovimientos` — leer/registrar gasto/ingreso/abono.
- `useSync` — sesión de nube, bajar al arrancar, subir en segundo plano, exponer
  el estado `conectado`.

Los hooks escriben **siempre primero en `store/local`** y luego disparan el push a
la nube sin bloquear la UI.

### `lib/finanzas.ts` — lógica de dominio pura
Sin React, sin I/O. Funciones testeables: interés mensual desde E.A., selección de
deuda objetivo, stats del mes, % de progreso, detección de gastos hormiga,
generación del plan mes a mes. Es el corazón y debe tener tests.

### `lib/supabase.ts` — cliente de nube
Crea el cliente solo si hay credenciales; si no, exporta `null` y `hayNube() ===
false`. Patrón en [.env.example](.env.example) y CLAUDE.md §8.

### `store/local.ts` — persistencia offline
Lee/escribe el estado completo en localStorage (clave tipo `miplan_v1`). Es la
fuente de verdad primaria.

### `types/index.ts` — modelo de datos
Tipos canónicos (ver CLAUDE.md §4). Todo lo demás depende de aquí.

---

## 3. Flujo de sincronización híbrida

### Arranque (`init`)
1. Pinta de inmediato con el estado de localStorage.
2. Si hay cliente Supabase: inicia sesión (sesión guardada o anónima).
3. Si hay sesión: `bajarDeNube()` reemplaza el estado local con el de la nube y
   re-renderiza. Si la nube está vacía (primer arranque), sube las deudas iniciales.
4. Muestra el indicador `☁ Sincronizado` o `📱 Solo en este equipo`.

### Escritura (registrar movimiento / aplicar intereses)
1. Muta el estado local + `guardarLocal()` + re-render (instantáneo).
2. Si hay nube: subir en segundo plano.
   - **Abono:** preferir el RPC atómico `supabase.rpc('registrar_abono', { p_deuda,
     p_monto })`, que inserta el movimiento y descuenta `saldo_actual`/ajusta `activa`
     en una sola transacción (evita el insert+update manual que puede quedar a medias).
   - **Gasto/ingreso:** `insert` simple en `movimientos`.
   - **Intereses:** `insert` en `intereses_aplicados` (el `unique(user_id, mes)` rechaza
     duplicados a nivel DB) + `update` de los saldos de las deudas vivas.
3. Si la subida falla, se loguea y la app sigue: el dato ya está local.

> Nota de esquema: cada tabla nombra distinto su timestamp (`creada_en`/`actualizada_en`
> en deudas, `creado_en` en movimientos, `aplicado_en` en intereses). `config` usa
> `user_id` como PK (upsert por usuario). El trigger `trg_deudas_actualizada` refresca
> `actualizada_en` solo. Ver [supabase_schema.sql](supabase_schema.sql).

### Estrategia de conflictos (estado actual)
El prototipo usa **"la nube manda al bajar, el local manda al escribir"** sin merge
fino: al arrancar, la nube reemplaza el local. Es suficiente para un usuario en
pocos dispositivos. Si en el futuro se usa en varios dispositivos a la vez, evaluar
timestamps/last-write-wins por fila. **No sobre-ingenierar antes de necesitarlo.**

---

## 4. Autenticación — **email + contraseña (con registro)**

La app usa **email + contraseña** de Supabase (`signInWithPassword` / `signUp`).
Pantalla dedicada [`AuthScreen.tsx`](src/components/AuthScreen.tsx) con dos modos
(Iniciar sesión / Crear cuenta) y opción de "usar sin cuenta" (modo solo-local).

Flujo (en `lib/sync.ts` + `store/AppContext.tsx`):
- **Arranque:** `restaurarSesion()` → si hay sesión persistida, baja datos; si no, se
  muestra `AuthScreen`. El badge del header reabre el login (`abrirAuth`).
- **Entrar:** `entrar(email, password)` → `signInWithPassword`.
- **Crear cuenta:** `registrarUsuario(email, password)` → `signUp`. Si el proyecto
  exige confirmar el correo, devuelve `sesionActiva: false` y la UI pide revisar el
  correo; si no, queda logueado al instante.
- **Auto-seed:** `sincronizarBajada(localDeudas)` baja de la nube; **si la cuenta no
  tiene deudas, las siembra** con las locales (`subirDeudasIniciales`) y vuelve a bajar.
  Así cada cuenta nueva queda con sus 9 deudas sin depender del `user_id` fijo del seed.
- Toda tabla se filtra por `auth.uid()` (RLS). Sin sesión → modo solo-local.

**Config en Supabase:** Authentication → Providers → **Email** habilitado. La opción
"Confirm email" decide si el registro requiere confirmación por correo (ON = más
seguro; OFF = acceso inmediato al crear cuenta). 

> El seed hardcodeado de [supabase_schema.sql](supabase_schema.sql) (UID `e55700c2-…`)
> ya no es necesario para cuentas nuevas: el auto-seed cubre ese caso. Solo verás esas
> filas si entras con la cuenta dueña de ese UID.

---

## 5. PWA

- `manifest.json` con nombre, colores de tema (`#0F2A24`), íconos 192/512, `display:
  standalone`.
- Service worker simple: network-first con fallback a caché (como el del prototipo,
  líneas ~696-700). Permite abrir offline.
- `beforeinstallprompt` captura el evento e ofrece un banner "Instalar".

---

## 6. Datos semilla

El prototipo trae 9 deudas reales precargadas (`DEUDAS_INIT`, total inicial
`$49.982.845`), 10 categorías de gasto (`CATEGORIAS`) y un plan de 14 meses
(`PLAN_MESES`). En la versión React decide si el plan se **calcula** desde las deudas
(ideal) o se mantiene como tabla precomputada. Calcularlo en `lib/finanzas.ts` es lo
correcto a futuro; replicar la tabla es aceptable para el MVP. Documenta la decisión
en CLAUDE.md §11.

---

## 7. Decisiones abiertas

| Tema | Estado |
|------|--------|
| Plan: ¿calculado o tabla fija? | Por decidir — MVP puede usar tabla fija |
| Auth: ¿anónimo o con email? | **Resuelto: email/OTP**, un solo dueño (ver §4) |
| Merge de conflictos multi-dispositivo | No implementado; nube-reemplaza-local basta hoy |
| Tests de `lib/finanzas` | Pendientes — añadir al implementar la Fase 3 |
