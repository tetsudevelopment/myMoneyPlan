// =====================================================================
//  Motor de finanzas de Mi Plan — lógica PURA (sin React, sin I/O).
//  Ver .claude/skills/motor-finanzas/SKILL.md y CLAUDE.md §5.
//  Cubierto por finanzas.test.ts.
// =====================================================================

import type { Bolsillo, Deuda, Moneda, Movimiento, TipoMovimiento } from '../types'
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

// ---------- Monedas (USD como saldo aparte) ----------

/** true si el movimiento está en dólares (undefined = COP). */
export const esUSD = (m: Movimiento): boolean => m.moneda === 'USD'

/** Cualquier valor que no sea 'USD' es COP (datos legados / columnas ausentes). */
export const normalizarMoneda = (m: unknown): Moneda => (m === 'USD' ? 'USD' : 'COP')

/** Garantiza que un bolsillo (posiblemente legado) tenga moneda. */
export const normalizarBolsillo = (b: Bolsillo): Bolsillo => ({
  ...b,
  moneda: normalizarMoneda(b.moneda),
})

/** Pesos (enteros) que resultan de convertir `montoUSD` a `tasa` COP por dólar. */
export function convertirUSDaCOP(montoUSD: number, tasa: number): number {
  if (!(montoUSD > 0) || !(tasa > 0)) return 0
  return Math.round(montoUSD * tasa)
}

const redondear2 = (n: number): number => Math.round(n * 100) / 100

/** Suma `delta` al saldo del bolsillo `id` (sin bajar de 0, a 2 decimales). Devuelve copia. */
export function aplicarDeltaBolsillo(bolsillos: Bolsillo[], id: string, delta: number): Bolsillo[] {
  return bolsillos.map((b) =>
    b.id === id ? { ...b, saldo: Math.max(0, redondear2(b.saldo + delta)) } : b,
  )
}

/** true si el bolsillo existe y su saldo cubre `monto` (comparación a 2 decimales). */
export function puedeRestar(bolsillos: Bolsillo[], id: string, monto: number): boolean {
  const b = bolsillos.find((x) => x.id === id)
  return !!b && redondear2(b.saldo) >= redondear2(monto)
}

/** Quita `bolsilloId` de los movimientos que apuntaban a un bolsillo eliminado. */
export function desvincularBolsillo(movimientos: Movimiento[], bolsilloId: string): Movimiento[] {
  return movimientos.map((m) => (m.bolsilloId === bolsilloId ? { ...m, bolsilloId: undefined } : m))
}

export const MSG_SALDO_INSUFICIENTE =
  'No se puede: ya usaste parte de esos dólares (convertidos o retirados) y el bolsillo no alcanza para revertir el ingreso.'

/**
 * Efecto en los bolsillos de editar (`nuevo`) o eliminar (`nuevo = null`) un ingreso USD.
 * Revierte el aporte viejo solo si su bolsillo aún existe; aplica el nuevo solo si
 * apunta a un bolsillo existente. Si revertir exige más que el saldo actual, no
 * cambia nada y devuelve `error` (nunca recorta en silencio).
 */
export function ajustarBolsillosIngresoUSD(
  bolsillos: Bolsillo[],
  viejo: Movimiento,
  nuevo: Movimiento | null,
): { bolsillos: Bolsillo[]; afectados: string[]; error?: string } {
  const existe = (id?: string) => !!id && bolsillos.some((b) => b.id === id)
  // Mismo bolsillo existente: solo cuenta el neto (nuevo - viejo). Si no cambia, no se toca nada.
  if (nuevo && existe(viejo.bolsilloId) && viejo.bolsilloId === nuevo.bolsilloId) {
    const neto = redondear2(nuevo.monto - viejo.monto)
    if (neto === 0) return { bolsillos, afectados: [] }
    if (neto < 0 && !puedeRestar(bolsillos, viejo.bolsilloId!, -neto)) {
      return { bolsillos, afectados: [], error: MSG_SALDO_INSUFICIENTE }
    }
    return {
      bolsillos: aplicarDeltaBolsillo(bolsillos, viejo.bolsilloId!, neto),
      afectados: [viejo.bolsilloId!],
    }
  }
  let res = bolsillos
  const afectados = new Set<string>()
  if (existe(viejo.bolsilloId)) {
    if (!puedeRestar(res, viejo.bolsilloId!, viejo.monto)) {
      return { bolsillos, afectados: [], error: MSG_SALDO_INSUFICIENTE }
    }
    res = aplicarDeltaBolsillo(res, viejo.bolsilloId!, -viejo.monto)
    afectados.add(viejo.bolsilloId!)
  }
  if (nuevo && existe(nuevo.bolsilloId)) {
    res = aplicarDeltaBolsillo(res, nuevo.bolsilloId!, nuevo.monto)
    afectados.add(nuevo.bolsilloId!)
  }
  return { bolsillos: res, afectados: [...afectados] }
}

/** Totales de ahorro por moneda; nunca se mezclan. */
export function totalesBolsillos(bolsillos: Bolsillo[]): { cop: number; usd: number } {
  let cop = 0
  let usd = 0
  for (const b of bolsillos) {
    if (b.moneda === 'USD') usd += b.saldo
    else cop += b.saldo
  }
  return { cop, usd }
}

// ---------- Stats del mes ----------

export interface StatsMes {
  pagado: number
  gastado: number
  /** Solo ingresos en COP. */
  ingresado: number
  /** Ingresos en dólares del mes (aparte; no cuentan como pesos). */
  ingresadoUSD: number
  disponible: number
}

export function statsDelMes(movimientos: Movimiento[], mes: string): StatsMes {
  const delMes = movimientos.filter((m) => m.fecha.startsWith(mes))
  const suma = (t: TipoMovimiento) =>
    delMes.filter((m) => m.tipo === t && !esUSD(m)).reduce((s, m) => s + m.monto, 0)
  const pagado = suma('abono')
  const gastado = suma('gasto')
  const ingresado = suma('ingreso')
  const ingresadoUSD = delMes
    .filter((m) => m.tipo === 'ingreso' && esUSD(m))
    .reduce((s, m) => s + m.monto, 0)
  return { pagado, gastado, ingresado, ingresadoUSD, disponible: ingresado - gastado - pagado }
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

export interface FlujoMes {
  /** 'YYYY-MM' */
  mes: string
  ingresos: number
  gastos: number
}

/**
 * Ingresos y gastos por mes para los últimos `nMeses` (incluido el actual).
 * `mesActualStr` es 'YYYY-MM'. Pura: deriva los meses por aritmética de fecha.
 */
export function flujoMensual(
  movimientos: Movimiento[],
  mesActualStr: string,
  nMeses = 6,
): FlujoMes[] {
  const [anio, mes] = mesActualStr.split('-').map(Number)
  const meses: string[] = []
  for (let i = nMeses - 1; i >= 0; i--) {
    const d = new Date(anio, mes - 1 - i, 1)
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return meses.map((ym) => {
    const delMes = movimientos.filter((m) => m.fecha.startsWith(ym))
    const ingresos = delMes.filter((m) => m.tipo === 'ingreso' && !esUSD(m)).reduce((s, m) => s + m.monto, 0)
    const gastos = delMes.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0)
    return { mes: ym, ingresos, gastos }
  })
}

export interface FlujoDia {
  /** Día del mes (1..N). */
  dia: number
  ingresos: number
  gastos: number
}

/** Ingresos y gastos por día para un mes 'YYYY-MM'. Pura. */
export function flujoDiario(movimientos: Movimiento[], mesStr: string): FlujoDia[] {
  const [anio, mes] = mesStr.split('-').map(Number)
  const dias = new Date(anio, mes, 0).getDate() // día 0 del mes siguiente = último del actual
  const res: FlujoDia[] = []
  for (let d = 1; d <= dias; d++) {
    const fecha = `${mesStr}-${String(d).padStart(2, '0')}`
    const delDia = movimientos.filter((m) => m.fecha === fecha)
    const ingresos = delDia.filter((m) => m.tipo === 'ingreso' && !esUSD(m)).reduce((s, m) => s + m.monto, 0)
    const gastos = delDia.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0)
    res.push({ dia: d, ingresos, gastos })
  }
  return res
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
  /** Deuda total que queda al cerrar ese mes. */
  restante: number
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

    const restante = activas.reduce((s, d) => s + Math.max(0, d.saldo), 0)
    plan.push({ mes, objetivo, pago: presupuestoMensual - pool, restante, liquidadas })
  }

  return plan
}

// ---------- Plan en pareja: reparto proporcional ----------

export interface AporteReparto {
  userId: string
  aporte: number
  /** Porcentaje del total (0-100). */
  pct: number
}

/**
 * Reparte `total` entre los miembros proporcional a su ingreso. Si nadie tiene
 * ingreso (suma 0), reparte en partes iguales.
 */
export function repartoProporcional(
  total: number,
  miembros: { userId: string; ingreso: number }[],
): AporteReparto[] {
  if (miembros.length === 0) return []
  const sumaIngresos = miembros.reduce((s, m) => s + Math.max(0, m.ingreso), 0)
  return miembros.map((m) => {
    const frac = sumaIngresos > 0 ? Math.max(0, m.ingreso) / sumaIngresos : 1 / miembros.length
    return { userId: m.userId, aporte: total * frac, pct: Math.round(frac * 100) }
  })
}

/** Presupuesto mensual de deuda por defecto: suma de cuotas + un extra. */
export function presupuestoDeudaDefault(deudas: Deuda[], extra = 1_312_776): number {
  return deudas.reduce((s, d) => s + d.cuota, 0) + extra
}
