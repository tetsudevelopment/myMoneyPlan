# Roadmap de mejoras — Mi Plan

Ideas de mejora priorizadas. ⭐ = recomendado. Marca `[x]` al completar.

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
