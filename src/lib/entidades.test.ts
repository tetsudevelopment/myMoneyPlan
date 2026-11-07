import { describe, expect, it } from 'vitest'
import { limpiarMonto, formatearMonto } from '../components/MoneyInput'
import { ENTIDADES, ENTIDAD_OTRA, esEntidadConocida } from './entidades'
import { fmtUSD } from './format'

describe('entidades', () => {
  const todas = ENTIDADES.flatMap((g) => g.entidades)
  it('incluye bancos, billeteras, inversión, exterior, Efectivo y Otra', () => {
    for (const e of ['Bancolombia', 'Nequi', 'Trii', 'Wise', 'Efectivo', ENTIDAD_OTRA]) {
      expect(todas).toContain(e)
    }
  })
  it('no tiene duplicados', () => {
    expect(new Set(todas).size).toBe(todas.length)
  })
  it('esEntidadConocida distingue lista, "Otra" y texto libre', () => {
    expect(esEntidadConocida('Davivienda')).toBe(true)
    expect(esEntidadConocida(ENTIDAD_OTRA)).toBe(false)
    expect(esEntidadConocida('Mi cooperativa')).toBe(false)
  })
})

describe('MoneyInput helpers', () => {
  it('COP solo deja dígitos', () => {
    expect(limpiarMonto('1.234,5', 'COP')).toBe('12345')
  })
  it('USD permite un punto y máximo 2 decimales', () => {
    expect(limpiarMonto('12.345', 'USD')).toBe('12.34')
    expect(limpiarMonto('1.2.3', 'USD')).toBe('1.23')
    expect(limpiarMonto('abc', 'USD')).toBe('')
  })
  it('formatea USD conservando el punto mientras se escribe', () => {
    expect(formatearMonto('1234.', 'USD')).toBe('1,234.')
    expect(formatearMonto('1234.5', 'USD')).toBe('1,234.5')
    expect(formatearMonto('', 'USD')).toBe('')
  })
})

describe('fmtUSD', () => {
  it('US$ con separador de miles y 2 decimales', () => {
    expect(fmtUSD(1234.5)).toBe('US$ 1,234.50')
    expect(fmtUSD(0)).toBe('US$ 0.00')
  })
})
