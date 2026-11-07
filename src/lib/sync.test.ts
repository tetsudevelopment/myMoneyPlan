import { describe, expect, it } from 'vitest'
import type { Bolsillo } from '../types'
import { extrasBolsillo } from './sync'

const b = (p: Partial<Bolsillo>): Bolsillo => ({ id: 'a', nombre: 'A', saldo: 0, moneda: 'COP', ...p })

describe('extrasBolsillo', () => {
  it('COP sin entidad no envía columnas nuevas (esquema viejo sigue funcionando)', () => {
    expect(extrasBolsillo(b({}))).toEqual({})
  })
  it('envía moneda USD y entidad cuando existen', () => {
    expect(extrasBolsillo(b({ moneda: 'USD', entidad: 'Wise' }))).toEqual({ moneda: 'USD', entidad: 'Wise' })
  })
  it('envía entidad null solo si se limpió explícitamente', () => {
    expect(extrasBolsillo(b({}), true)).toEqual({ entidad: null })
    expect(extrasBolsillo(b({ entidad: 'Nequi' }), true)).toEqual({ entidad: 'Nequi' })
  })
})
