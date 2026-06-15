import { describe, expect, it } from 'vitest'
import type { Deuda, Movimiento } from '../types'
import {
  aplicarAbono,
  aplicarIntereses,
  deudaObjetivo,
  deudaTotalActual,
  deudasVivas,
  detectarHormiga,
  flujoMensual,
  gastosPorCategoria,
  generarPlan,
  interesDelMes,
  pctPagadoDeuda,
  pctPagadoTotal,
  presupuestoDeudaDefault,
  statsDelMes,
  tasaMensualDesdeEA,
} from './finanzas'

const deuda = (p: Partial<Deuda>): Deuda => ({
  id: 'x',
  nombre: 'X',
  tipo: 'tarjeta',
  saldoInicial: 1000,
  saldo: 1000,
  cuota: 100,
  tasaEA: 24,
  orden: 1,
  ...p,
})

const mov = (p: Partial<Movimiento>): Movimiento => ({
  id: Math.random(),
  tipo: 'gasto',
  monto: 100,
  fecha: '2026-06-10',
  ...p,
})

describe('intereses', () => {
  it('convierte 24.33% E.A. a ~1.83% mensual', () => {
    expect(tasaMensualDesdeEA(24.33)).toBeCloseTo(0.018311, 5)
  })
  it('una tasa de 0% no genera interés', () => {
    expect(interesDelMes(1_000_000, 0)).toBe(0)
  })
  it('interesDelMes = saldo * tasaMensual', () => {
    expect(interesDelMes(1_000_000, 24.33)).toBeCloseTo(18313.09, 1)
  })
  it('aplicarIntereses suma a las vivas y reporta el total, ignora pagadas', () => {
    const ds = [deuda({ id: 'a', saldo: 1_000_000, tasaEA: 24 }), deuda({ id: 'b', saldo: 1 })]
    const { deudas, totalInteres } = aplicarIntereses(ds)
    expect(deudas[0].saldo).toBeGreaterThan(1_000_000)
    expect(deudas[1].saldo).toBe(1) // pagada, intacta
    expect(totalInteres).toBeCloseTo(deudas[0].saldo - 1_000_000, 6)
  })
})

describe('estrategia bola de nieve', () => {
  const ds = [
    deuda({ id: 'a', orden: 2, saldo: 500 }),
    deuda({ id: 'b', orden: 1, saldo: 800 }),
    deuda({ id: 'c', orden: 3, saldo: 0 }), // pagada
  ]
  it('el objetivo es la viva de menor orden', () => {
    expect(deudaObjetivo(ds)?.id).toBe('b')
  })
  it('deudasVivas excluye las pagadas y ordena por orden', () => {
    expect(deudasVivas(ds).map((d) => d.id)).toEqual(['b', 'a'])
  })
  it('si no hay vivas, no hay objetivo', () => {
    expect(deudaObjetivo([deuda({ saldo: 0 })])).toBeUndefined()
  })
  it('deudaTotalActual suma solo saldos positivos', () => {
    expect(deudaTotalActual(ds)).toBe(1300)
  })
})

describe('abonos y progreso', () => {
  it('aplicarAbono descuenta el saldo sin bajar de 0', () => {
    const ds = [deuda({ id: 'a', saldo: 300 })]
    expect(aplicarAbono(ds, 'a', 500)[0].saldo).toBe(0)
    expect(aplicarAbono(ds, 'a', 100)[0].saldo).toBe(200)
  })
  it('pctPagadoDeuda: 100% si está pagada, proporcional si no', () => {
    expect(pctPagadoDeuda(deuda({ saldo: 0 }))).toBe(100)
    expect(pctPagadoDeuda(deuda({ saldoInicial: 1000, saldo: 250 }))).toBe(75)
  })
  it('pctPagadoTotal usa el total inicial dado', () => {
    expect(pctPagadoTotal([deuda({ saldo: 250 })], 1000)).toBe(75)
  })
})

describe('stats y gastos del mes', () => {
  const movs = [
    mov({ tipo: 'ingreso', monto: 5000, fecha: '2026-06-01' }),
    mov({ tipo: 'gasto', monto: 1000, cat: 'mercado', fecha: '2026-06-02' }),
    mov({ tipo: 'gasto', monto: 200, cat: 'comida', fecha: '2026-06-03' }),
    mov({ tipo: 'abono', monto: 800, fecha: '2026-06-04' }),
    mov({ tipo: 'gasto', monto: 999, cat: 'mercado', fecha: '2026-05-30' }), // otro mes
  ]
  it('statsDelMes solo cuenta el mes pedido y calcula disponible', () => {
    const s = statsDelMes(movs, '2026-06')
    expect(s).toEqual({ pagado: 800, gastado: 1200, ingresado: 5000, disponible: 3000 })
  })
  it('gastosPorCategoria agrupa y ordena desc', () => {
    const g = gastosPorCategoria(movs, '2026-06')
    expect(g).toEqual([
      { cat: 'mercado', total: 1000 },
      { cat: 'comida', total: 200 },
    ])
  })
})

describe('flujo mensual', () => {
  const movs = [
    mov({ tipo: 'ingreso', monto: 5000, fecha: '2026-06-01' }),
    mov({ tipo: 'gasto', monto: 1200, fecha: '2026-06-02' }),
    mov({ tipo: 'gasto', monto: 800, fecha: '2026-05-10' }),
    mov({ tipo: 'ingreso', monto: 4000, fecha: '2026-05-03' }),
    mov({ tipo: 'abono', monto: 999, fecha: '2026-06-05' }), // no cuenta en flujo
  ]
  it('devuelve un punto por cada mes pedido, terminando en el actual', () => {
    const serie = flujoMensual(movs, '2026-06', 6)
    expect(serie).toHaveLength(6)
    expect(serie[serie.length - 1].mes).toBe('2026-06')
    expect(serie[serie.length - 2].mes).toBe('2026-05')
  })
  it('suma ingresos y gastos por mes (ignora abonos)', () => {
    const serie = flujoMensual(movs, '2026-06', 2)
    expect(serie[1]).toEqual({ mes: '2026-06', ingresos: 5000, gastos: 1200 })
    expect(serie[0]).toEqual({ mes: '2026-05', ingresos: 4000, gastos: 800 })
  })
})

describe('gastos hormiga', () => {
  it('se activa con 2+ gastos hormiga', () => {
    const movs = [
      mov({ tipo: 'gasto', monto: 50, cat: 'comida' }),
      mov({ tipo: 'gasto', monto: 70, cat: 'gaming' }),
    ]
    const a = detectarHormiga(movs, '2026-06')
    expect(a).toEqual({ activa: true, total: 120, cantidad: 2 })
  })
  it('no se activa con un solo gasto hormiga', () => {
    const a = detectarHormiga([mov({ tipo: 'gasto', monto: 50, cat: 'comida' })], '2026-06')
    expect(a.activa).toBe(false)
  })
  it('ignora categorías que no son hormiga', () => {
    const a = detectarHormiga(
      [
        mov({ tipo: 'gasto', monto: 50, cat: 'mercado' }),
        mov({ tipo: 'gasto', monto: 70, cat: 'gasolina' }),
      ],
      '2026-06',
    )
    expect(a.activa).toBe(false)
  })
})

describe('generarPlan (snowball)', () => {
  const ds = [
    deuda({ id: 'a', nombre: 'A', orden: 1, saldo: 1000, saldoInicial: 1000, cuota: 100, tasaEA: 24 }),
    deuda({ id: 'b', nombre: 'B', orden: 2, saldo: 2000, saldoInicial: 2000, cuota: 150, tasaEA: 20 }),
  ]
  it('liquida todas las deudas en un número finito de meses', () => {
    const plan = generarPlan(ds, 600)
    expect(plan.length).toBeGreaterThan(0)
    expect(plan.length).toBeLessThan(600)
    const ultimas = plan.flatMap((m) => m.liquidadas)
    expect(ultimas).toContain('A')
    expect(ultimas).toContain('B')
  })
  it('ataca primero la deuda de menor orden', () => {
    const plan = generarPlan(ds, 600)
    expect(plan[0].objetivo).toBe('A')
    const mesLiqA = plan.findIndex((m) => m.liquidadas.includes('A'))
    const mesLiqB = plan.findIndex((m) => m.liquidadas.includes('B'))
    expect(mesLiqA).toBeLessThanOrEqual(mesLiqB)
  })
  it('respeta el tope de meses si el presupuesto no alcanza ni los intereses', () => {
    const plan = generarPlan([deuda({ saldo: 1_000_000, cuota: 0, tasaEA: 30 })], 1, 50)
    expect(plan.length).toBe(50)
  })
  it('presupuestoDeudaDefault = suma de cuotas + extra', () => {
    expect(presupuestoDeudaDefault(ds, 1000)).toBe(100 + 150 + 1000)
  })
})
