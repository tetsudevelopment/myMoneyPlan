// Entidades financieras colombianas para asignar a un bolsillo de ahorro.

export interface GrupoEntidades {
  grupo: string
  entidades: string[]
}

/** Valor del selector que revela el campo de texto libre. */
export const ENTIDAD_OTRA = 'Otra'

export const ENTIDADES: GrupoEntidades[] = [
  {
    grupo: 'Bancos',
    entidades: [
      'Bancolombia',
      'Davivienda',
      'Banco de Bogotá',
      'BBVA Colombia',
      'Banco de Occidente',
      'Banco Popular',
      'Banco AV Villas',
      'Banco Caja Social',
      'Scotiabank Colpatria',
      'Itaú',
      'Banco Agrario',
      'Banco Falabella',
      'Banco Pichincha',
      'Banco GNB Sudameris',
      'Bancoomeva',
      'Banco W',
      'Banco Finandina',
      'Banco Serfinanza',
      'Mibanco',
    ],
  },
  {
    grupo: 'Billeteras y neobancos',
    entidades: ['Nu Colombia', 'Lulo Bank', 'Nequi', 'Daviplata', 'RappiPay', 'Movii', 'Dale!', 'Ualá'],
  },
  { grupo: 'Inversión', entidades: ['Trii', 'Tyba'] },
  { grupo: 'Exterior / USD', entidades: ['Global66', 'Wise', 'Payoneer'] },
  { grupo: 'Otros', entidades: ['Efectivo', ENTIDAD_OTRA] },
]

const TODAS = new Set(ENTIDADES.flatMap((g) => g.entidades))

/** true si el texto es una entidad de la lista (distinta de "Otra"). */
export const esEntidadConocida = (e: string): boolean => e !== ENTIDAD_OTRA && TODAS.has(e)
