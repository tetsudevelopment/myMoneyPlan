# Roadmap de mejoras — Mi Plan

Ideas de mejora priorizadas. ⭐ = recomendado. Marca `[x]` al completar.

---

## v2 — Plan en pareja (espacio compartido)

> Spec acordada el 2026-06-20. Decisiones del usuario: invitación **por código**,
> gastos **mensuales por categoría**, reparto **solo proporcional al ingreso**,
> espacio de **2 personas**.

**Idea:** un espacio compartido, aparte del plan personal, donde 2 personas ven los
mismos gastos y deudas del hogar, cada quien pone su ingreso y la app calcula cuánto
aporta cada uno **proporcional a su ingreso**. El plan personal sigue privado y
local-first; el de pareja es **solo nube** (requiere sesión, no funciona offline).

**Modelo de datos (tablas nuevas, no tocan lo existente):**
- `espacios` `{ id, nombre, codigo, creado_por, creado_en }`
- `espacio_miembros` `{ espacio_id, user_id, nombre, ingreso }` (máx. 2)
- `espacio_gastos` `{ id, espacio_id, nombre, icono, color, monto_mensual }`
- `espacio_deudas` `{ id, espacio_id, nombre, tipo, saldo, cuota, tasa_ea, orden }` (fase posterior)

**Compartir seguro (RLS por membresía):** función `es_miembro(espacio)` SECURITY
DEFINER (evita recursión de RLS); las policies usan eso en vez de `user_id = auth.uid()`.
Crear/unirse vía RPC SECURITY DEFINER (`crear_espacio`, `unirse_a_espacio`) que valida
el código y que el espacio tenga < 2 miembros. Un usuario pertenece a un solo espacio.

**Reparto (lógica pura, testeable):** `aporte_i = total × ingreso_i / Σ ingresos`;
si falta un ingreso → 50/50. `total = Σ gastos mensuales (+ cuotas de deudas, fase posterior)`.

**UX:** switch Personal/Pareja. En Pareja: crear espacio o unirse por código; lista de
miembros con su ingreso; gastos por categoría (editables); tarjeta de reparto; (fase
posterior) deudas compartidas. SQL en `supabase_pareja.sql`.

**Fases:** B1 SQL · B2 lógica reparto · B3 sync+hook · B4 vista (crear/unirse, ingresos,
gastos, reparto) · B5 acceso · (posterior) deudas compartidas + switch superior pulido.

## Fase 6 — COMPLETA (2026-06-14) ✅

- [x] **1. Editar y borrar movimientos** — corregir/eliminar gastos, ingresos y
  abonos; al borrar/editar un abono se revierte el saldo de la deuda.
- [x] **2. Gestionar deudas** — agregar deuda nueva, editar saldo/tasa/cuota/orden,
  borrar y marcar como saldada.
- [x] **3. Confirmaciones** — diálogo de confirmación antes de acciones irreversibles
  (aplicar intereses, borrar movimiento/deuda).
- [x] **4. Onboarding / configuración inicial** — primera pantalla para meter ingreso y
  tus propias deudas, en vez de arrancar con datos de ejemplo precargados.

## Alto impacto (siguiente)

- [ ] **5. Plan dinámico y configurable** ⭐ — calcular el extra mensual desde
  ingreso − gastos − cuotas; slider "si pago X más, salgo en N meses".
- [ ] **6. Filtros e historial en Gastos** — por mes, por categoría, tendencia mensual.
- [ ] **7. Recordatorios / Web Push** — "aplica tus intereses", "registra tus gastos".
- [ ] **8. Gráfica de proyección** — línea de deuda total en el tiempo hacia cero.

## Calidad técnica / robustez

- [ ] **9. Sincronización en tiempo real** (Supabase Realtime).
- [ ] **10. Recuperar contraseña** (reset por correo).
- [ ] **11. Tests de UI / capa de sync** (Supabase mockeado).
- [ ] **12. Cola de reintentos / indicador "pendiente de sincronizar"** offline.

## Pulido

- [ ] **13. Modo oscuro**
- [ ] **14. Animaciones de transición entre vistas**
- [ ] **15. Exportar a CSV/PDF** el historial
- [ ] **16. Íconos PNG** para instalación 100% en iOS (hoy SVG)
