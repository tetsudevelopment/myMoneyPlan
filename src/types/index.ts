// =====================================================================
//  Modelo de datos canónico de Mi Plan (ver CLAUDE.md §4)
//  Estos tipos son la fuente de verdad para toda la app (UI, hooks, sync).
// =====================================================================

export type TipoDeuda = 'tarjeta' | 'credito'
export type TipoMovimiento = 'gasto' | 'ingreso' | 'abono'

/** Una deuda (tarjeta o crédito) con su saldo vivo. */
export interface Deuda {
  id: string
  nombre: string
  tipo: TipoDeuda
  /** No cambia; base para calcular el % pagado. */
  saldoInicial: number
  /** Baja con abonos, sube al aplicar intereses. */
  saldo: number
  /** Cuota mensual mínima. */
  cuota: number
  /** Tasa efectiva anual en %, ej. 24.33 (no fracción). */
  tasaEA: number
  /** Orden de ataque de la estrategia bola de nieve (1 = primero). */
  orden: number
}

/** Un gasto, ingreso o abono. */
export interface Movimiento {
  /** Date.now() en local; uuid en la nube. */
  id: number | string
  tipo: TipoMovimiento
  monto: number
  desc?: string
  /** Solo gastos; id de una CATEGORIA. */
  cat?: string
  /** Solo abonos; id de la deuda. */
  deudaId?: string
  /** 'YYYY-MM-DD'. */
  fecha: string
  /** Marca de creación ISO (para ordenar por cuándo se registró). */
  creadoEn?: string
}

/** Configuración financiera personal del usuario. */
export interface Config {
  ingresoMensual: number
  presupuestoOcio: number
}

/** Datos de perfil del usuario. */
export interface Perfil {
  nombre: string
  telefono: string
  /** Imagen de perfil como data URL (redimensionada). */
  avatar: string | null
}

/** Un "bolsillo" de ahorro con su saldo. */
export interface Bolsillo {
  id: string
  nombre: string
  saldo: number
  creadoEn?: string
}

/** Dinero prestado a una persona. Pendiente = monto - abonado. */
export interface Prestamo {
  id: string
  persona: string
  monto: number
  abonado: number
  fecha: string
  nota?: string
  creadoEn?: string
}

/** Categoría de gasto (con ícono y color para la UI). */
export interface Categoria {
  id: string
  nombre: string
  icono: string
  color: string
}

/** Forma completa del estado persistido (localStorage + espejo de la nube). */
export interface EstadoApp {
  deudas: Deuda[]
  movimientos: Movimiento[]
  /** Meses 'YYYY-MM' en los que ya se aplicaron intereses. */
  interesesAplicados: string[]
  config: Config
  bolsillos: Bolsillo[]
  prestamos: Prestamo[]
  /** Categorías de gasto creadas por el usuario (además de las predefinidas). */
  categorias: Categoria[]
}
