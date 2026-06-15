// Helpers de fecha. Aislados aquí para poder inyectar "hoy" en los tests.

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Fecha de hoy en formato 'YYYY-MM-DD'. */
export const hoy = (): string => new Date().toISOString().slice(0, 10)

/** Mes actual en formato 'YYYY-MM'. */
export const mesActual = (): string => new Date().toISOString().slice(0, 7)

/** Nombre legible del mes a partir de un índice 0-11. */
export const nombreMes = (indice: number): string => MESES[indice] ?? ''

/** Nombre del mes actual, ej. "junio". */
export const nombreMesActual = (): string => nombreMes(new Date().getMonth())

/** Nombre del mes actual con año, ej. "junio 2026". */
export const nombreMesActualConAnio = (): string =>
  `${nombreMesActual()} ${new Date().getFullYear()}`

/** Saludo según la hora del día. */
export const saludo = (): string => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
