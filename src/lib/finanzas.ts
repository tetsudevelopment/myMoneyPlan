// =====================================================================
//  Motor de finanzas de Mi Plan — lógica PURA (sin React, sin I/O).
//  Ver .claude/skills/motor-finanzas/SKILL.md y CLAUDE.md §5.
//  Cubierto por finanzas.test.ts.
// =====================================================================

import type { Deuda, Movimiento, TipoMovimiento } from '../types'
import { CATEGORIAS_HORMIGA } from './constantes'

// ---------- Intereses ----------

/** Convierte tasa efectiva anual (%) a tasa mensual (fracción). */
export function tasaMensualDesdeEA(tasaEA: number): number {
  return Math.pow(1 + tasaEA / 100, 1 / 12) - 1
}

/** Interés que genera un saldo en un mes según su tasa E.A. */
export function interesDelMes(saldo: number, tasaEA: number): number {
  return saldo * tasaMensualDesdeEA(tasaEA)
}

// ---------- Estado de las deudas ----------

/** Una deuda está "viva" si su saldo es mayor a 1. */
export const esViva = (d: Deuda): boolean => d.saldo > 1

/** Deudas vivas ordenadas por estrategia de ataque (orden asc). */
export function deudasVivas(deudas: Deuda[]): Deuda[] {
  return deudas.filter(esViva).sort((a, b) => a.orden - b.orden)
}

/** Deuda objetivo actual: la viva de menor orden. */
export function deudaObjetivo(deudas: Deuda[]): Deuda | undefined {
  return deudasVivas(deudas)[0]
}

/** Suma de los saldos vivos. */
export function deudaTotalActual(deudas: Deuda[]): number {
  return deudas.reduce((s, d) => s + Math.max(0, d.saldo), 0)
}

/** Suma de los saldos iniciales (base del progreso total). */
export function deudaInicialTotal(deudas: Deuda[]): number {
  return deudas.reduce((s, d) => s + d.saldoInicial, 0)
}

/** % pagado de una deuda respecto a su saldo inicial (0-100). */
export function pctPagadoDeuda(d: Deuda): number {
  if (d.saldo <= 1) return 100
  if (d.saldoInicial <= 0) return 0
  return Math.max(0, Math.round((1 - d.saldo / d.saldoInicial) * 100))
}

/** % pagado del total respecto a la deuda inicial total (0-100). */
export function pctPagadoTotal(deudas: Deuda[], totalInicial = deudaInicialTotal(deudas)): number {
  if (totalInicial <= 0) return 0
  return Math.max(0, Math.round((1 - deudaTotalActual(deudas) / totalInicial) * 100))
}

// ---------- Stats del mes ----------

export interface StatsMes {
  pagado: number
  gastado: number
  ingresado: number
  disponible: number
}

export function statsDelMes(movimientos: Movimiento[], mes: string): StatsMes {
  const delMes = movimientos.filter((m) => m.fecha.startsWith(mes))
  const suma = (t: TipoMovimiento) =>
    delMes.filter((m) => m.tipo === t).reduce((s, m) => s + m.monto, 0)
  const pagado = suma('abono')
  const gastado = suma('gasto')
  const ingresado = suma('ingreso')
  return { pagado, gastado, ingresado, disponible: ingresado - gastado - pagado }
}

// ---------- Gastos ----------

export interface GastoCategoria {
  cat: string
  total: number
}

/** Gastos del mes agrupados por categoría, de mayor a menor. */
export function gastosPorCategoria(movimientos: Movimiento[], mes: string): GastoCategoria[] {
  const acum = new Map<string, number>()
  for (const m of movimientos) {
    if (m.tipo !== 'gasto' || !m.fecha.startsWith(mes)) continue
    const cat = m.cat ?? 'otros'
    acum.set(cat, (acum.get(cat) ?? 0) + m.monto)
  }
  return [...acum.entries()]
    .map(([cat, total]) => ({ cat, total }))
    .sort((a, b) => b.total - a.total)
}

export interface AlertaHormiga {
  activa: boolean
  total: number
  cantidad: number
}

/** Detecta gastos hormiga del mes (categorías pequeñas y recurrentes). */
export function detectarHormiga(movimientos: Movimiento[], mes: string): AlertaHormiga {
  const hormiga = movimientos.filter(
    (m) =>
      m.tipo === 'gasto' &&
      m.fecha.startsWith(mes) &&
      CATEGORIAS_HORMIGA.includes(m.cat ?? ''),
  )
  const total = hormiga.reduce((s, m) => s + m.monto, 0)
  return { activa: total > 0 && hormiga.length >= 2, total, cantidad: hormiga.length }
}

// ---------- Mutaciones puras ----------

/** Aplica el interés del mes a todas las deudas vivas. Devuelve copia + total. */
export function aplicarIntereses(deudas: Deuda[]): { deudas: Deuda[]; totalInteres: number } {
  let totalInteres = 0
  const out = deudas.map((d) => {
    if (!esViva(d)) return d
    const interes = interesDelMes(d.saldo, d.tasaEA)
    totalInteres += interes
    return { ...d, saldo: d.saldo + interes }
  })
  return { deudas: out, totalInteres }
}

/** Aplica un abono a una deuda (sin bajar de 0). Devuelve copia. */
export function aplicarAbono(deudas: Deuda[], deudaId: string, monto: number): Deuda[] {
  return deudas.map((d) =>
    d.id === deudaId ? { ...d, saldo: Math.max(0, d.saldo - monto) } : d,
  )
}

// ---------- Plan bola de nieve ----------

export interface MesPlan {
  mes: number
  objetivo: string
  /** Cuánto se pagó ese mes en total. */
  pago: number
  /** Deudas que quedan liquidadas ese mes. */
  liquidadas: string[]
}

/**
 * Simula la estrategia bola de nieve mes a mes hasta liquidar todo.
 * Cada mes: aplica intereses, paga las cuotas mínimas y vuelca el excedente
 * (más las cuotas liberadas) a la deuda objetivo. `presupuestoMensual` es el
 * total disponible para deudas cada mes.
 */
export function generarPlan(
  deudas: Deuda[],
  presupuestoMensual: number,
  maxMeses = 600,
): MesPlan[] {
  const activas = deudas.map((d) => ({ ...d }))
  const plan: MesPlan[] = []
  let mes = 0

  while (activas.some(esViva) && mes < maxMeses) {
    mes++
    // 1) intereses del mes
    for (const d of activas) {
      if (esViva(d)) d.saldo += interesDelMes(d.saldo, d.tasaEA)
    }
    let pool = presupuestoMensual
    const liquidadas: string[] = []
    const objetivo = deudaObjetivo(activas)?.nombre ?? ''

    const liquidar = (d: Deuda) => {
      if (d.saldo <= 1 && !liquidadas.includes(d.nombre)) liquidadas.push(d.nombre)
    }

    // 2) cuotas mínimas
    for (const d of activas) {
      if (!esViva(d) || pool <= 0) continue
      const pago = Math.min(d.saldo, d.cuota, pool)
      d.saldo -= pago
      pool -= pago
      liquidar(d)
    }

    // 3) excedente al objetivo (con rollover en cadena)
    let guardia = 0
    while (pool > 0.5 && activas.some(esViva) && guardia++ < deudas.length + 1) {
      const t = deudaObjetivo(activas)!
      const pago = Math.min(t.saldo, pool)
      t.saldo -= pago
      pool -= pago
      liquidar(t)
    }

    plan.push({ mes, objetivo, pago: presupuestoMensual - pool, liquidadas })
  }

  return plan
}

/** Presupuesto mensual de deuda por defecto: suma de cuotas + un extra. */
export function presupuestoDeudaDefault(deudas: Deuda[], extra = 1_312_776): number {
  return deudas.reduce((s, d) => s + d.cuota, 0) + extra
}
