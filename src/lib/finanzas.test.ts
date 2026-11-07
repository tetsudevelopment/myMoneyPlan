import { describe, expect, it } from 'vitest'
import type { Bolsillo, Deuda, Movimiento } from '../types'
import {
  aplicarAbono,
  aplicarIntereses,
  ajustarBolsillosIngresoUSD,
  aplicarDeltaBolsillo,
  desvincularBolsillo,
  puedeRestar,
  convertirUSDaCOP,
  esUSD,
  normalizarBolsillo,
  normalizarMoneda,
  totalesBolsillos,
  deudaObjetivo,
  deudaTotalActual,
  deudasVivas,
  detectarHormiga,
  flujoDiario,
  flujoMensual,
  gastosPorCategoria,
  generarPlan,
  interesDelMes,
  pctPagadoDeuda,
  pctPagadoTotal,
  presupuestoDeudaDefault,
  repartoProporcional,
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
    expect(s).toEqual({
      pagado: 800,
      gastado: 1200,
      ingresado: 5000,
      ingresadoUSD: 0,
      disponible: 3000,
    })
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

describe('flujo diario', () => {
  const movs = [
    mov({ tipo: 'gasto', monto: 100, fecha: '2026-06-01' }),
    mov({ tipo: 'gasto', monto: 250, fecha: '2026-06-15' }),
    mov({ tipo: 'ingreso', monto: 3000, fecha: '2026-06-15' }),
    mov({ tipo: 'gasto', monto: 999, fecha: '2026-05-15' }), // otro mes
  ]
  it('junio 2026 tiene 30 días', () => {
    expect(flujoDiario(movs, '2026-06')).toHaveLength(30)
  })
  it('suma por día (ignora otros meses)', () => {
    const serie = flujoDiario(movs, '2026-06')
    expect(serie[0]).toEqual({ dia: 1, ingresos: 0, gastos: 100 })
    expect(serie[14]).toEqual({ dia: 15, ingresos: 3000, gastos: 250 })
    expect(serie[1]).toEqual({ dia: 2, ingresos: 0, gastos: 0 })
  })
  it('febrero 2026 tiene 28 días', () => {
    expect(flujoDiario([], '2026-02')).toHaveLength(28)
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

describe('reparto proporcional (pareja)', () => {
  it('reparte proporcional al ingreso', () => {
    const r = repartoProporcional(1_000_000, [
      { userId: 'a', ingreso: 3_000_000 },
      { userId: 'b', ingreso: 2_000_000 },
    ])
    expect(r[0]).toEqual({ userId: 'a', aporte: 600_000, pct: 60 })
    expect(r[1]).toEqual({ userId: 'b', aporte: 400_000, pct: 40 })
  })
  it('si nadie tiene ingreso, reparte 50/50', () => {
    const r = repartoProporcional(1000, [
      { userId: 'a', ingreso: 0 },
      { userId: 'b', ingreso: 0 },
    ])
    expect(r[0].aporte).toBe(500)
    expect(r[1].aporte).toBe(500)
  })
  it('la suma de aportes da el total', () => {
    const r = repartoProporcional(999, [
      { userId: 'a', ingreso: 1 },
      { userId: 'b', ingreso: 2 },
    ])
    expect(r[0].aporte + r[1].aporte).toBeCloseTo(999, 6)
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
    // El saldo restante baja hasta 0 al final
    expect(plan[plan.length - 1].restante).toBeLessThanOrEqual(1)
    expect(plan[0].restante).toBeGreaterThan(plan[plan.length - 1].restante)
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

describe('monedas (USD como saldo aparte)', () => {
  const usd = (p: Partial<Movimiento>) =>
    mov({ tipo: 'ingreso', moneda: 'USD', bolsilloId: 'b1', ...p })

  it('esUSD: undefined y COP no son USD', () => {
    expect(esUSD(mov({}))).toBe(false)
    expect(esUSD(mov({ moneda: 'COP' }))).toBe(false)
    expect(esUSD(usd({ monto: 10 }))).toBe(true)
  })

  it('statsDelMes ignora USD en ingresado/disponible y lo suma en ingresadoUSD', () => {
    const movs = [
      mov({ tipo: 'ingreso', monto: 5000, fecha: '2026-06-01' }),
      usd({ monto: 300.5, fecha: '2026-06-02' }),
      usd({ monto: 100, fecha: '2026-06-03' }),
      usd({ monto: 999, fecha: '2026-05-03' }), // otro mes
      mov({ tipo: 'gasto', monto: 1000, fecha: '2026-06-04' }),
    ]
    const s = statsDelMes(movs, '2026-06')
    expect(s.ingresado).toBe(5000)
    expect(s.ingresadoUSD).toBeCloseTo(400.5, 6)
    expect(s.disponible).toBe(4000)
  })

  it('flujoMensual y flujoDiario ignoran ingresos USD', () => {
    const movs = [
      mov({ tipo: 'ingreso', monto: 5000, fecha: '2026-06-01' }),
      usd({ monto: 300, fecha: '2026-06-01' }),
    ]
    expect(flujoMensual(movs, '2026-06', 1)[0].ingresos).toBe(5000)
    expect(flujoDiario(movs, '2026-06')[0].ingresos).toBe(5000)
  })

  it('convertirUSDaCOP redondea a pesos enteros', () => {
    expect(convertirUSDaCOP(500, 4100)).toBe(2_050_000)
    expect(convertirUSDaCOP(10.55, 4123.4)).toBe(Math.round(10.55 * 4123.4))
    expect(Number.isInteger(convertirUSDaCOP(33.33, 3999.99))).toBe(true)
  })

  it('convertirUSDaCOP con valores inválidos devuelve 0', () => {
    expect(convertirUSDaCOP(-5, 4000)).toBe(0)
    expect(convertirUSDaCOP(5, 0)).toBe(0)
    expect(convertirUSDaCOP(NaN, 4000)).toBe(0)
  })

  it('normalizarMoneda: cualquier cosa que no sea USD es COP', () => {
    expect(normalizarMoneda('USD')).toBe('USD')
    expect(normalizarMoneda(undefined)).toBe('COP')
    expect(normalizarMoneda('EUR')).toBe('COP')
  })

  it('normalizarBolsillo da moneda COP a datos legados', () => {
    const legado = { id: 'a', nombre: 'Viejo', saldo: 10 } as Bolsillo
    expect(normalizarBolsillo(legado).moneda).toBe('COP')
    expect(normalizarBolsillo({ ...legado, moneda: 'USD' }).moneda).toBe('USD')
  })

  it('aplicarDeltaBolsillo suma/resta sin bajar de 0 y no toca otros', () => {
    const bs: Bolsillo[] = [
      { id: 'a', nombre: 'A', saldo: 100, moneda: 'USD' },
      { id: 'b', nombre: 'B', saldo: 50, moneda: 'COP' },
    ]
    const r = aplicarDeltaBolsillo(bs, 'a', 25.5)
    expect(r[0].saldo).toBeCloseTo(125.5, 6)
    expect(r[1]).toBe(bs[1])
    expect(aplicarDeltaBolsillo(bs, 'a', -500)[0].saldo).toBe(0)
  })

  it('totalesBolsillos separa COP y USD (nunca los mezcla)', () => {
    const bs: Bolsillo[] = [
      { id: 'a', nombre: 'A', saldo: 100, moneda: 'USD' },
      { id: 'b', nombre: 'B', saldo: 50000, moneda: 'COP' },
      { id: 'c', nombre: 'C', saldo: 20.5, moneda: 'USD' },
    ]
    expect(totalesBolsillos(bs)).toEqual({ cop: 50000, usd: 120.5 })
  })
})

describe('monedas: robustez de saldos USD', () => {
  const bs = (saldo: number): Bolsillo[] => [{ id: 'a', nombre: 'A', saldo, moneda: 'USD' }]
  const ing = (p: Partial<Movimiento>): Movimiento =>
    mov({ tipo: 'ingreso', moneda: 'USD', bolsilloId: 'a', monto: 100, ...p })

  it('aplicarDeltaBolsillo redondea a 2 decimales (sin deriva flotante)', () => {
    expect(aplicarDeltaBolsillo(bs(0.1), 'a', 0.2)[0].saldo).toBe(0.3)
    expect(aplicarDeltaBolsillo(bs(0.3), 'a', -0.1)[0].saldo).toBe(0.2)
  })

  it('puedeRestar compara con redondeo (convertir todo funciona)', () => {
    const saldo = 0.1 + 0.2 // 0.30000000000000004
    expect(puedeRestar(bs(saldo), 'a', 0.3)).toBe(true)
    expect(puedeRestar(bs(10), 'a', 10.01)).toBe(false)
    expect(puedeRestar(bs(10), 'zzz', 1)).toBe(false)
  })

  it('desvincularBolsillo limpia bolsilloId de los movimientos que lo referencian', () => {
    const movs = [ing({ id: 1 }), ing({ id: 2, bolsilloId: 'b' }), mov({ id: 3 })]
    const r = desvincularBolsillo(movs, 'a')
    expect(r[0].bolsilloId).toBeUndefined()
    expect(r[1].bolsilloId).toBe('b')
    expect(r[2]).toBe(movs[2])
  })

  it('eliminar un ingreso USD resta del bolsillo', () => {
    const r = ajustarBolsillosIngresoUSD(bs(150), ing({ monto: 100 }), null)
    expect(r.error).toBeUndefined()
    expect(r.bolsillos[0].saldo).toBe(50)
    expect(r.afectados).toEqual(['a'])
  })

  it('bloquea revertir más de lo que hay (ya convertiste parte)', () => {
    const r = ajustarBolsillosIngresoUSD(bs(20), ing({ monto: 100 }), null)
    expect(r.error).toMatch(/dólares/i)
    expect(r.bolsillos[0].saldo).toBe(20)
    expect(r.afectados).toEqual([])
  })

  it('editar monto: revierte el viejo y aplica el nuevo', () => {
    const r = ajustarBolsillosIngresoUSD(bs(100), ing({ monto: 100 }), ing({ monto: 120 }))
    expect(r.bolsillos[0].saldo).toBe(120)
  })

  it('bolsillo viejo inexistente: sin reversión; solo aplica el nuevo si se elige uno válido', () => {
    const viejo = ing({ bolsilloId: 'borrado', monto: 100 })
    const sinElegir = ajustarBolsillosIngresoUSD(bs(50), viejo, { ...viejo, monto: 100, bolsilloId: undefined })
    expect(sinElegir.bolsillos[0].saldo).toBe(50)
    expect(sinElegir.afectados).toEqual([])
    const elegido = ajustarBolsillosIngresoUSD(bs(50), viejo, { ...viejo, bolsilloId: 'a' })
    expect(elegido.bolsillos[0].saldo).toBe(150)
    expect(elegido.afectados).toEqual(['a'])
  })

  it('cambiar de bolsillo revierte en el viejo y aplica en el nuevo', () => {
    const dos: Bolsillo[] = [
      { id: 'a', nombre: 'A', saldo: 100, moneda: 'USD' },
      { id: 'c', nombre: 'C', saldo: 5, moneda: 'USD' },
    ]
    const r = ajustarBolsillosIngresoUSD(dos, ing({ monto: 100 }), ing({ monto: 100, bolsilloId: 'c' }))
    expect(r.bolsillos.map((b) => b.saldo)).toEqual([0, 105])
    expect(r.afectados.sort()).toEqual(['a', 'c'])
  })

  it('editar solo desc/fecha (monto y bolsillo iguales) no toca el bolsillo ni se bloquea', () => {
    // 100 USD ingresados pero ya se convirtieron 80: saldo 20
    const viejo = ing({ monto: 100 })
    const r = ajustarBolsillosIngresoUSD(bs(20), viejo, { ...viejo, desc: 'otra cosa' })
    expect(r.error).toBeUndefined()
    expect(r.bolsillos[0].saldo).toBe(20)
    expect(r.afectados).toEqual([])
  })

  it('mismo bolsillo y otro monto: aplica solo el neto (bajar exige saldo >= diferencia)', () => {
    const viejo = ing({ monto: 100 })
    const baja = ajustarBolsillosIngresoUSD(bs(20), viejo, { ...viejo, monto: 90 })
    expect(baja.error).toBeUndefined()
    expect(baja.bolsillos[0].saldo).toBe(10)
    const bajaDeMas = ajustarBolsillosIngresoUSD(bs(20), viejo, { ...viejo, monto: 70 })
    expect(bajaDeMas.error).toBeDefined()
    const sube = ajustarBolsillosIngresoUSD(bs(20), viejo, { ...viejo, monto: 130 })
    expect(sube.bolsillos[0].saldo).toBe(50)
  })
})
