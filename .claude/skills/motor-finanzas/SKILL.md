---
name: motor-finanzas
description: Lógica de dominio de "Mi Plan" — cálculo de intereses (E.A.→mensual), estrategia bola de nieve / deuda objetivo, stats del mes, % de progreso, detección de gastos hormiga y generación del plan mes a mes. Úsalo al implementar o modificar src/lib/finanzas.ts o cualquier cálculo financiero de la app.
---

# Motor de finanzas — Mi Plan

Reglas de cálculo de la app. Toda esta lógica debe vivir **pura** (sin React, sin
I/O) en `src/lib/finanzas.ts` y tener tests. La implementación de referencia está en
[MiPlan_Supabase.html](../../../MiPlan_Supabase.html). No la reinventes: cópiala y
tipala.

## Convenciones

- Montos en pesos (enteros al mostrar). `tasaEA` es **porcentaje** (24.33), no fracción.
- `saldoInicial` no cambia; `saldo` baja con abonos y sube con intereses.
- "Deuda viva" = `saldo > 1`. "Pagada" = `saldo <= 1`.
- Mes actual = `new Date().toISOString().slice(0,7)` → `'YYYY-MM'`.

## 1. Interés mensual desde tasa efectiva anual

```ts
export function tasaMensualDesdeEA(tasaEA: number): number {
  return Math.pow(1 + tasaEA / 100, 1 / 12) - 1
}

export function interesDelMes(saldo: number, tasaEA: number): number {
  return saldo * tasaMensualDesdeEA(tasaEA)
}
```

**Anti-duplicado:** los intereses se aplican **una sola vez por mes**. Guarda el mes
`'YYYY-MM'` en `intereses_aplicados` y verifica antes de aplicar. Aplicar suma el
interés a `saldo` de cada deuda viva y registra `total_interes`. Requiere
confirmación explícita del usuario.

## 2. Deuda objetivo (bola de nieve / avalancha híbrida)

La objetivo es la deuda **viva de menor `orden`**:

```ts
export function deudaObjetivo(deudas: Deuda[]): Deuda | undefined {
  return deudas.filter(d => d.saldo > 1).sort((a, b) => a.orden - b.orden)[0]
}
```

Se pagan las cuotas mínimas de todas y el dinero extra va a la objetivo hasta
liquidarla; luego pasa a la siguiente en `orden`.

## 3. Stats del mes

```ts
const delMes = movs.filter(m => m.fecha.startsWith(mesActual))
const pagado   = sum(delMes.filter(m => m.tipo === 'abono'))
const gastado  = sum(delMes.filter(m => m.tipo === 'gasto'))
const ingresado= sum(delMes.filter(m => m.tipo === 'ingreso'))
const disponible = ingresado - gastado - pagado
```

## 4. Progreso

```ts
const pctDeuda = Math.max(0, Math.round((1 - saldo / saldoInicial) * 100))
const pctTotal = Math.max(0, Math.round((1 - totalActual / DEUDA_INICIAL_TOTAL) * 100))
```

## 5. Gastos hormiga

Categorías hormiga: `['comida','gaming','suscrip','otros']`. Muestra alerta si en el
mes hay **total > 0 y al menos 2 transacciones** de esas categorías. Mensaje
motivador: cuánto se llevó y que ese dinero podría ir a la deuda objetivo.

## 6. Plan mes a mes

14 meses mostrando qué deuda atacar y cuándo se liquida cada una. Decisión abierta
(ver ARCHITECTURE.md §6/§7): el MVP puede usar la tabla precomputada `PLAN_MESES` del
prototipo; lo ideal a futuro es **calcularlo** simulando mes a mes:

```
para cada mes:
  aplicar interés a cada deuda viva
  pagar cuota mínima de cada deuda viva
  aplicar el extra disponible a la deuda objetivo
  marcar como liquidada toda deuda que llegue a saldo <= 0
  registrar { mes, objetivo, liquidadas[] } hasta que no queden deudas vivas
```

Si lo calculas, este simulador reemplaza a `PLAN_MESES`. Cubre con tests el caso de
liquidación a mitad de mes (el sobrante rueda a la siguiente deuda — efecto bola de
nieve).

## Checklist al tocar este motor

- [ ] La función es pura (mismos inputs → mismo output, sin Date global escondido salvo el "mes actual" inyectado).
- [ ] Hay test del cálculo de interés con una tasa real (ej. 24.33% E.A.).
- [ ] El anti-duplicado de intereses sigue intacto.
- [ ] La selección de objetivo respeta `orden` y solo deudas vivas.
